import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from AbacatePay Webhook DEBUG MODE!")

serve(async (req) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Content-Type": "application/json"
    }

    try {
        if (req.method === 'GET') {
            return new Response(JSON.stringify({ message: 'Função está ONLINE!' }), { status: 200, headers })
        }

        const url = new URL(req.url)
        const secret = url.searchParams.get('webhookSecret')
        const envSecret = Deno.env.get('ABACATE_WEBHOOK_SECRET')

        // 1. Verificar Secret
        if (envSecret && secret !== envSecret) {
            return new Response(JSON.stringify({ error: 'Secret inválido' }), { status: 401, headers })
        }

        const payload = await req.json()

        // 2. Verificar Evento
        if (payload.event && payload.event !== 'billing.paid') {
            return new Response(JSON.stringify({ message: `Evento ignorado: ${payload.event}` }), { status: 200, headers })
        }

        // 3. Extrair Email
        let email = null;
        if (payload.data?.billing?.customer?.metadata?.email) {
            email = payload.data.billing.customer.metadata.email;
        } else if (payload.data?.billing?.customer?.email) {
            email = payload.data.billing.customer.email;
        } else {
            const customerData = payload.data?.customer || payload.customer || payload.data || {}
            email = customerData.metadata?.email || customerData.email || payload.email
        }

        if (!email) {
            // MUDANÇA: Retorna 400 para aparecer erro no painel
            return new Response(JSON.stringify({ error: 'Email NÃO encontrado no JSON recebido.' }), { status: 400, headers })
        }

        // 4. Buscar Usuário
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? ''
        )
        const normalizedEmail = email.trim().toLowerCase()

        const { data: user, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', normalizedEmail)
            .single()

        if (fetchError || !user) {
            // MUDANÇA: Retorna 404 para aparecer erro no painel e sabermos que não achou o user
            return new Response(JSON.stringify({
                error: `Usuário não encontrado no banco.`,
                email_buscado: normalizedEmail,
                detalhe_erro: fetchError
            }), { status: 404, headers })
        }

        // 5. Atualizar Usuário
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ approved: true })
            .eq('id', user.id)

        if (updateError) {
            return new Response(JSON.stringify({ error: 'Erro ao atualizar perfil', detalhe: updateError }), { status: 500, headers })
        }

        return new Response(JSON.stringify({ message: `SUCESSO: Usuário ${normalizedEmail} aprovado!` }), { status: 200, headers })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 400, headers })
    }
})
