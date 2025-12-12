import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from AbacatePay Webhook v3!")

serve(async (req) => {
    try {
        const url = new URL(req.url)
        const secret = url.searchParams.get('webhookSecret')
        const envSecret = Deno.env.get('ABACATE_WEBHOOK_SECRET')

        console.log(`Recebendo webhook... Secret na URL: ${secret ? 'Sim' : 'Não'}`)

        // 1. Verificar o Segredo (Segurança)
        if (envSecret && secret !== envSecret) {
            console.error('Erro: Secret inválido ou ausente na URL.')
            return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Secret inválido. Verifique a URL no AbacatePay.' }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            })
        }

        const payload = await req.json()
        console.log('Payload recebido:', JSON.stringify(payload))

        // 2. Verificar evento
        if (payload.event && payload.event !== 'billing.paid') {
            console.log(`Evento ignorado: ${payload.event}`)
            return new Response(JSON.stringify({ message: 'Evento ignorado' }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        }

        // 3. Extrair o email do cliente (CORRIGIDO PARA ESTRUTURA REAL)
        // Estrutura esperada: data.billing.customer.metadata.email
        let email = null;

        // Tenta pegar do caminho correto (data.billing.customer.metadata.email)
        if (payload.data?.billing?.customer?.metadata?.email) {
            email = payload.data.billing.customer.metadata.email;
        }
        // Tenta pegar de data.billing.customer.email (caso mude)
        else if (payload.data?.billing?.customer?.email) {
            email = payload.data.billing.customer.email;
        }
        // Fallbacks antigos (só por garantia)
        else {
            const customerData = payload.data?.customer || payload.customer || payload.data || {}
            email = customerData.metadata?.email || customerData.email || payload.email
        }

        if (!email) {
            console.error('Email NÃO encontrado no payload. Estrutura recebida:', JSON.stringify(payload))
            return new Response(JSON.stringify({ error: 'Email não encontrado no payload' }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        }

        console.log(`Email extraído: ${email}. Buscando usuário...`)

        // 4. Aprovar o usuário no Supabase
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Normalizar email (minúsculo e sem espaços)
        const normalizedEmail = email.trim().toLowerCase()

        const { data: user, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', normalizedEmail)
            .single()

        if (fetchError || !user) {
            console.error(`Usuário não encontrado no banco: ${normalizedEmail}`)
            // Retornamos 200 aqui para o AbacatePay não ficar tentando reenviar (já que o erro é nosso de não ter o usuário)
            return new Response(JSON.stringify({ message: 'Usuário não encontrado no sistema, mas webhook recebido.' }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        }

        // Atualizar para aprovado
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ approved: true })
            .eq('id', user.id)

        if (updateError) {
            console.error('Erro ao atualizar perfil:', updateError)
            return new Response(JSON.stringify({ error: 'Erro ao atualizar perfil' }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            })
        }

        console.log(`SUCESSO: Usuário ${normalizedEmail} aprovado!`)

        return new Response(JSON.stringify({ message: `Usuário ${normalizedEmail} aprovado com sucesso!` }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })

    } catch (error) {
        console.error('Erro CRÍTICO no processamento:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }
})
