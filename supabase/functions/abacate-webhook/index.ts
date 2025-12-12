import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("Hello from AbacatePay Webhook SIMPLE TEST!")

serve(async (req) => {
    try {
        // Apenas aceita a requisição e retorna 200 OK
        const payload = await req.json()
        console.log('Payload recebido no teste simplificado:', JSON.stringify(payload))

        return new Response(JSON.stringify({ message: 'Webhook recebido com sucesso (MODO TESTE)' }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })

    } catch (error) {
        console.error('Erro no teste simplificado:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }
})
