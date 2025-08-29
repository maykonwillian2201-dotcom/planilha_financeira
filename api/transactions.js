import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    // Adiciona cabeçalhos CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    console.log(`[${new Date().toISOString()}] Recebida requisição: ${request.method}`);

    try {
        if (request.method === 'GET') {
            const { rows } = await sql`SELECT * FROM transactions ORDER BY created_at DESC;`;
            return response.status(200).json(rows);
        } else if (request.method === 'POST') {
            console.log("Corpo da requisição recebido:", request.body);

            const { tipo, descricao, categoria, data } = request.body;
            const valor = Number(request.body.valor);

            console.log("Dados processados:", { tipo, descricao, valor, categoria, data });

            if (!tipo || !descricao || !categoria || !data || isNaN(valor) || valor <= 0) {
                console.log("Falha na validação dos dados.");
                return response.status(400).json({ error: 'Dados inválidos ou faltando.', received: request.body });
            }
            
            console.log("Tentando inserir no banco de dados...");
            await sql`
                INSERT INTO transactions (tipo, descricao, valor, categoria, data)
                VALUES (${tipo}, ${descricao}, ${valor}, ${categoria}, ${data});
            `;
            console.log("Inserção no banco de dados bem-sucedida.");
            
            return response.status(201).json({ message: 'Transação criada com sucesso' });

        } else if (request.method === 'DELETE') {
            const { id } = request.query;
            if (!id) {
                return response.status(400).json({ error: 'ID da transação é obrigatório' });
            }
            await sql`DELETE FROM transactions WHERE id = ${id};`;
            return response.status(200).json({ message: 'Transação deletada com sucesso' });
        } else {
            return response.status(405).json({ message: 'Método não permitido' });
        }
    } catch (error) {
        console.error("ERRO CRÍTICO NO SERVIDOR:", error);
        return response.status(500).json({ 
            error: "Ocorreu um erro interno no servidor.",
            details: error.message,
            stack: error.stack 
        });
    }
}
