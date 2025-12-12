import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from AbacatePay Webhook!")

serve(async (req) => {
    try {
        const url = new URL(req.url)
        const secret = url.searchParams.get('webhookSecret')
        const envSecret = Deno.env.get('ABACATE_WEBHOOK_SECRET')

        // 1. Verificar o Segredo (Segurança)
        if (secret !== envSecret) {
            return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Secret inválido' }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            })
        }

        const payload = await req.json()
        console.log('Webhook received:', payload)

        // 2. Verificar se é um evento de pagamento aprovado
        if (payload.event !== 'billing.paid') {
            return new Response(JSON.stringify({ message: 'Evento ignorado (não é billing.paid)' }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        }

        // 3. Extrair o email do cliente
        // O AbacatePay pode mandar em customer.metadata.email ou customer.email
        const email = payload.data?.customer?.metadata?.email || payload.data?.customer?.email

        if (!email) {
            console.error('Email não encontrado no payload')
            return new Response(JSON.stringify({ error: 'Email não encontrado no payload' }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        }

        // 4. Aprovar o usuário no Supabase
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Primeiro, buscamos o usuário para garantir que ele existe
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single()

        if (fetchError || !user) {
            console.error('Usuário não encontrado:', email)
            return new Response(JSON.stringify({ error: 'Usuário não encontrado no sistema' }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            })
        }

        // Atualizamos para aprovado
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ approved: true })
            .eq('email', email)

        if (updateError) {
            console.error('Erro ao atualizar perfil:', updateError)
            return new Response(JSON.stringify({ error: 'Erro ao atualizar perfil' }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            })
        }

        console.log(`Usuário ${email} aprovado com sucesso!`)

        return new Response(JSON.stringify({ message: `Usuário ${email} aprovado com sucesso!` }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })

    } catch (error) {
        console.error('Erro no processamento:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }
})
