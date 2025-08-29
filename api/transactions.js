// Importa o cliente do Vercel Postgres
import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // Adiciona cabeçalhos para permitir requisições de qualquer origem (CORS)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde a requisições OPTIONS (necessário para CORS)
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // Lógica para buscar transações (GET)
    if (request.method === 'GET') {
      const { rows } = await sql`SELECT * FROM transactions ORDER BY created_at DESC;`;
      return response.status(200).json(rows);
    }
    // Lógica para adicionar uma nova transação (POST)
    else if (request.method === 'POST') {
      const { tipo, descricao, categoria, data } = request.body;
      // Converte o valor para número e faz uma validação mais forte
      const valor = Number(request.body.valor);

      if (!tipo || !descricao || !categoria || !data || isNaN(valor) || valor <= 0) {
        return response.status(400).json({ error: 'Dados inválidos ou faltando.' });
      }
      
      await sql`
        INSERT INTO transactions (tipo, descricao, valor, categoria, data)
        VALUES (${tipo}, ${descricao}, ${valor}, ${categoria}, ${data});
      `;
      return response.status(201).json({ message: 'Transação criada com sucesso' });
    }
    // Lógica para deletar uma transação (DELETE)
    else if (request.method === 'DELETE') {
        const { id } = request.query;
        if (!id) {
            return response.status(400).json({ error: 'ID da transação é obrigatório' });
        }
        await sql`DELETE FROM transactions WHERE id = ${id};`;
        return response.status(200).json({ message: 'Transação deletada com sucesso' });
    }
    // Se o método não for permitido
    else {
      return response.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    console.error(error);
    // Retorna o erro real do banco de dados para depuração
    return response.status(500).json({ error: error.message });
  }
}
