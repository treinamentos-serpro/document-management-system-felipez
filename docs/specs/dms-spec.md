## Plano: Especificação do DMS

Preencher somente `dms-spec.md`, que está vazio, seguindo `spec-template.md`. O documento descreverá o sistema pretendido e distinguirá esses requisitos do estado atual do seed. Nenhum arquivo de backend ou frontend será implementado nesta tarefa.

**Etapas**
1. Completar objetivo, escopo, pressupostos e itens fora do escopo: upload, listagem e download; armazenamento exclusivamente local; sem nuvem nem versionamento.
2. Detalhar requisitos funcionais e não funcionais com critérios verificáveis, incluindo validação de upload, erros, segurança de caminhos, estados esperados da interface e configuração por ambiente.
3. Definir o modelo de metadados (`id`, `originalName`, `size`, `uploadedAt`, `owner`) e como ele se relaciona ao arquivo em disco. Registrar que os arquivos persistem em `storage`, enquanto os metadados em memória se perdem após reinício.
4. Especificar os contratos propostos para `POST /upload`, `GET /documents` e `GET /documents/:id/download`: entrada multipart, respostas, códigos HTTP, erros e cabeçalhos de download. Explicar o proxy `/api` do Vite sem apresentá-lo como configuração de produção.
5. Documentar as responsabilidades da Clean Architecture simples e o uso obrigatório de Multer `diskStorage`. Incluir no plano de execução do documento as etapas futuras de backend, testes, frontend e integração, sem executá-las agora.
6. Revisar consistência entre requisitos, dados e contratos, e confirmar que apenas o documento-alvo foi alterado.

**Premissas a registrar**
- Os endpoints de documentos são contratos futuros: atualmente o backend só implementa `GET /health`.
- Sem autenticação no MVP, `owner` será informativo e não implicará isolamento de acesso.
- Limite e tipos aceitos devem aparecer como decisões de configuração/pendências, não como política já acordada.
- O identificador público não será usado diretamente como caminho do arquivo; o nome físico será gerado pelo servidor.

A exploração também confirmou que o frontend ainda é placeholder e que o teste existente é apenas de fumaça. O plano completo está registrado na memória da sessão. Como esta conversa está no modo **Plano**, não posso gravar o documento no workspace nesta etapa; a execução do plano depende da aprovação/handoff.