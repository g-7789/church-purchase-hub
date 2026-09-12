# Church Purchase Hub

Crie um sistema web (PWA, mobile-first) para gerenciar o processo de compras 

do setor de Manutenção de uma igreja local, conectado ao Supabase.

CONTEXTO DO PROCESSO:

O setor de Manutenção identifica uma necessidade e solicita uma compra. 

O setor de Compras busca 3 cotações de fornecedores. Dependendo do valor, 

a compra é aprovada automaticamente ou precisa de aval de um encarregado. 

Após aprovação, a compra é efetuada. O produto chega na sede (Central) e é 

recebido por um irmão responsável junto com a Nota Fiscal, que depois é 

repassada ao setor Financeiro.

PAPÉIS DE USUÁRIO (com login/autenticação via Supabase):

- Manutenção: cria solicitações de compra, acompanha status

- Compras: gerencia cotações, cadastra fornecedores, movimenta o status

- Encarregado: aprova compras acima de um valor limite configurável

- Recebimento: dá baixa quando o produto chega, anexa foto da NF

- Financeiro: recebe a NF, marca como concluído

ENTIDADES PRINCIPAIS (modelar no Supabase):

1. solicitacoes_compra: item, quantidade, motivo, solicitante, status, 

   valor final, data de criação, prazo desejado

2. cotacoes: vinculada a uma solicitação, com fornecedor, valor, prazo 

   de entrega (mínimo 3 por solicitação)

3. fornecedores: nome, contato/whatsapp, categoria, observações (histórico 

   de confiabilidade)

4. anexos: fotos de nota fiscal e cotações, vinculadas à solicitação

5. usuarios: nome, papel (role), setor

FLUXO DE STATUS (pipeline):

Solicitado → Em cotação → Aguardando aprovação → Aprovado → Comprado → 

Recebido (com NF) → Concluído (repassado ao financeiro)

TELAS NECESSÁRIAS:

1. Tela "Hoje": lista de tarefas/pendências do usuário logado, ordenadas 

   por urgência/prazo

2. Lista de solicitações de compra (estilo kanban por status, com filtro 

   por setor/responsável)

3. Detalhe de uma solicitação: histórico completo, cotações registradas, 

   anexos, botão de ação conforme o papel do usuário logado

4. Nova solicitação de compra (formulário simples)

5. Cadastro/busca de fornecedores, com histórico de cotações anteriores 

   por fornecedor

6. Tela de configuração de faixas de valor para aprovação (editável por 

   administrador)

ESTILO E EXPERIÊNCIA:

- Interface em português do Brasil

- Design limpo, funcional e direto — sem elementos decorativos 

  desnecessários, foco total em usabilidade no celular

- Botões grandes, fácil de usar por pessoas não-técnicas

- Cada usuário só vê as ações relevantes ao seu papel

Priorize funcionalidade e organização de dados no Supabase (com Row Level 

Security por papel de usuário) sobre estética elaborada.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7517c41d-1b55-4de4-a35e-58745700a754).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
