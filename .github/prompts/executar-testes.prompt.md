---
description: Executa testes e validações automatizadas do backend e frontend.
name: executar-testes
argument-hint: escopo opcional (all, backend ou frontend)
agent: agent
---

# Executar testes do projeto

Execute as verificações do escopo `${input:escopo:all}`. O projeto não possui `package.json` na raiz, então use os scripts dos diretórios correspondentes.

## Verificações

- `backend` ou `all`: execute `npm test --prefix backend`.
- `frontend` ou `all`: execute `npm run build --prefix frontend`. O frontend ainda não possui um script de testes automatizados; o build valida a compilação e a resolução dos módulos.
- Se o escopo não for `all`, `backend` ou `frontend`, informe os valores aceitos e não execute comandos.

## Regras

- Execute os comandos no terminal e aguarde a conclusão; não deduza sucesso apenas pela configuração ou por resultados anteriores.
- Não inicie servidores de desenvolvimento nem acesse serviços externos.
- Não altere código, testes ou dependências para fazer uma verificação passar. Se algo falhar, apresente o comando, o erro relevante e o arquivo ou área provável; aguarde pedido para corrigir.
- Não execute verificações fora do escopo selecionado.

## Resultado

Informe cada comando executado e se passou ou falhou. Para falhas, resuma a mensagem relevante sem omitir o código de saída e diferencie erro de teste de erro de ambiente.
