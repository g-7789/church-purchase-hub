<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Organização de branches

Toda alteração é feita em uma branch própria, numerada em sequência:

```
NNN-tipo-descricao-curta
```

- `NNN`: número sequencial com 3 dígitos (`001`, `002`, ...). É o protocolo da alteração.
- `tipo`: `feat` (funcionalidade nova), `fix` (correção), `ajuste` (melhoria/visual), `docs` ou `infra`.
- `descricao-curta`: poucas palavras, minúsculas, separadas por hífen, sem acentos.

Exemplo: `002-feat-relatorio-mensal`.

Regras:

1. Antes de criar a branch, veja o último número em `docs/BRANCHES.md` e use o próximo.
2. Registre a branch em `docs/BRANCHES.md` (número, branch, descrição, status) no primeiro commit.
3. Mensagens de commit começam com o protocolo: `[002] Adiciona relatório mensal`.
4. A branch vai para a `main` por Pull Request com o título `[NNN] Descrição`. Depois do merge, marque o status como `Concluída`.
5. Nunca reescreva histórico já enviado (sem force push, rebase ou amend).
