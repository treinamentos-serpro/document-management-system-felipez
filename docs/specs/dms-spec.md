## Especificação - Document Management System

**Status:** proposta para o MVP. Os contratos e requisitos abaixo descrevem o comportamento alvo; não significam que os endpoints já estejam implementados.

## 1. Objetivo

Entregar uma aplicação web simples para enviar documentos, consultar os documentos cadastrados no processo atual da aplicação e baixar seus arquivos, mantendo os binários exclusivamente no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição, com registro dos metadados do documento.
- Listagem dos documentos registrados durante a execução atual do backend.
- Download de um documento pelo identificador público.
- Interface React para upload, listagem, download e apresentação de estados de carregamento e erro.
- Gestão simples de proprietário como metadado informativo no MVP.
- Armazenamento dos arquivos em `backend/storage`, usando Multer com `diskStorage`.

### Fora do escopo

- Armazenamento em nuvem, banco de dados ou provedores externos de upload.
- Versionamento, edição, conversão, pré-visualização ou processamento do conteúdo dos documentos.
- Autenticação, autorização, compartilhamento ou isolamento de documentos entre usuários no MVP.
- Exclusão de documentos, busca avançada, pastas e auditoria.
- Garantia de que o catálogo de metadados sobreviva a reinicializações do backend.

### Premissas e decisões propostas

- O MVP é de instância única e sem autenticação. `owner` identifica uma configuração local, não uma identidade verificada nem uma fronteira de autorização. Proposta: usar `DMS_DEFAULT_OWNER`, com valor padrão `local`; a decisão deve ser confirmada antes de implementar caso o produto espere outro fluxo de identidade.
- Proposta para o primeiro limite: tamanho máximo configurável por `MAX_FILE_SIZE_MB`, padrão de 10 MiB. Tipos são aceitos sem allowlist no MVP, mas nunca executados ou interpretados pelo servidor; MIME e extensão enviados pelo cliente não são confiáveis. Uma allowlist de tipos é decisão de produto pendente.
- A API backend usa os caminhos sem prefixo descritos neste documento. O cliente web usa `/api`; no desenvolvimento, o proxy do Vite remove esse prefixo e encaminha ao backend. O roteamento equivalente em produção precisa ser fornecido pelo ambiente de implantação.
- Datas são armazenadas e transmitidas em UTC no formato ISO 8601.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | Uma requisição multipart válida com um arquivo cria um identificador, grava o arquivo localmente e retorna os metadados; o documento passa a aparecer na listagem e pode ser baixado. |
| RF-02 | O sistema valida o envio. | Ausência de arquivo, arquivo vazio ou arquivo acima do limite configurado é rejeitado com erro documentado; um envio rejeitado não deixa metadado ou arquivo parcial acessível. |
| RF-03 | O sistema registra metadados do documento. | O cadastro contém `id`, `originalName`, `size`, `uploadedAt` e `owner` conforme o modelo de dados. |
| RF-04 | O usuário pode listar documentos. | A resposta contém apenas os documentos conhecidos pelo processo atual, em ordem decrescente de `uploadedAt`; empates são ordenados por `id` crescente. Lista vazia retorna sucesso com array vazio. |
| RF-05 | O usuário pode baixar um documento pelo identificador. | Um identificador existente retorna os bytes do arquivo associado, como anexo e com o nome original seguro para o cabeçalho de download. |
| RF-06 | O sistema informa recursos inexistentes. | Identificador desconhecido retorna `404` sem revelar caminhos internos ou detalhes do filesystem. |
| RF-07 | A interface permite completar o fluxo principal. | A interface oferece seleção e envio de arquivo, mostra estado de envio, atualiza a listagem após sucesso e disponibiliza ação de download por item. |
| RF-08 | A interface comunica falhas recuperáveis. | Erros de validação e de rede são apresentados em português; após falha, o usuário pode tentar novamente sem recarregar a aplicação. |
| RF-09 | O sistema mantém a propriedade como metadado. | Cada documento contém `owner`; no MVP, o valor vem da configuração local e não é usado para autenticar ou restringir listagem/download. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos enviados devem ser gravados somente no filesystem local em `backend/storage`, utilizando Multer configurado com `diskStorage`. Não usar armazenamento externo. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. Reiniciar o backend limpa o catálogo; arquivos previamente gravados podem continuar no diretório, mas não serão listáveis ou baixáveis sem metadados em memória. |
| RNF-03 | Configurações operacionais devem vir de variáveis de ambiente, incluindo `PORT`, diretório de armazenamento, limite de tamanho e proprietário local padrão. Valores padrão devem permitir execução local. |
| RNF-04 | O identificador público nunca deve ser concatenado diretamente a um caminho de arquivo. O nome físico deve ser gerado pelo servidor, e o caminho final deve permanecer dentro do diretório de armazenamento. |
| RNF-05 | O servidor deve tratar erros de leitura/escrita e falhas do Multer nos limites HTTP, retornando mensagens seguras sem stack trace, caminhos absolutos ou detalhes internos ao cliente. |
| RNF-06 | O nome original é dado de apresentação, não caminho de armazenamento. Deve ser tratado contra separadores de diretório e caracteres de controle antes de ser usado em cabeçalhos HTTP. |
| RNF-07 | A aplicação não deve executar, avaliar ou servir o upload como conteúdo ativo inline. Download deve usar disposição `attachment`; o tipo de conteúdo deve ser conservador. |
| RNF-08 | As camadas internas não devem depender de Express ou de detalhes do frontend. O fluxo backend deve respeitar `routes -> controllers -> services -> repositories`. |
| RNF-09 | A cobertura automatizada deve verificar os contratos de sucesso e erro de upload, listagem e download, incluindo filesystem temporário e limpeza de arquivos quando o cadastro falhar. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string (UUID) | Sim | Identificador público, único por documento e independente do nome físico. |
| `originalName` | string | Sim | Nome informado pelo cliente, preservado para exibição e download após sanitização apropriada. |
| `size` | number (inteiro) | Sim | Tamanho do arquivo em bytes, obtido do arquivo gravado, não confiado do cliente. |
| `uploadedAt` | string (ISO 8601 UTC) | Sim | Data e hora em que o upload foi concluído com sucesso. |
| `owner` | string | Sim | Proprietário informativo do MVP; valor proposto via `DMS_DEFAULT_OWNER`, padrão `local`. Não implica autenticação. |

### Persistência e associação do arquivo

- Repositório de metadados: coleção em memória indexada por `id`, válida somente durante a vida do processo.
- Repositório de arquivos: filesystem em `backend/storage`, com Multer `diskStorage`.
- O nome do arquivo físico deve ser gerado pelo servidor (preferencialmente UUID, sem reutilizar `originalName`). O repositório associa `id` ao nome físico; essa associação pode ser mantida junto aos metadados em memória e não é exposta pela API.
- O upload só é considerado concluído quando arquivo e metadados estiverem associados. Se a gravação de metadados falhar após gravar o arquivo, remover o arquivo parcial; se a remoção falhar, registrar erro interno sem expor o caminho ao cliente.
- Reiniciar o processo perde tanto os metadados quanto a associação em memória. Não reconstruir automaticamente o catálogo lendo nomes do diretório. Arquivos órfãos podem permanecer até uma futura política de limpeza; não apagar arquivos automaticamente sem uma regra de retenção aprovada.

## 6. Contratos de API

### Convenções

- Os caminhos abaixo são os caminhos backend. Durante desenvolvimento, o frontend os chama com prefixo `/api` (por exemplo, `/api/documents`), encaminhado pelo proxy Vite para `/documents` no backend.
- Formato JSON UTF-8. Respostas de erro não incluem stack trace ou caminhos locais.
- Formato de erro comum: `{ "error": { "code": "...", "message": "..." } }`.
- Campos adicionais não documentados não devem ser necessários para o cliente.

### `POST /upload`

**Entrada:** `multipart/form-data`, com exatamente um arquivo no campo `file`. Campos textuais adicionais não são aceitos no MVP. Tamanho máximo conforme `MAX_FILE_SIZE_MB` (proposta: 10 MiB por padrão).

**Sucesso:** `201 Created`, `Content-Type: application/json`.

```json
{
	"document": {
		"id": "b3c8f7c4-7b1c-4b0b-8d59-4d8d5f6f6e13",
		"originalName": "relatorio.pdf",
		"size": 24810,
		"uploadedAt": "2026-09-29T12:00:00.000Z",
		"owner": "local"
	}
}
```

**Erros:**

| HTTP | Código | Condição |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Campo `file` ausente ou requisição multipart inválida. |
| `400` | `FILE_EMPTY` | Arquivo com zero bytes. |
| `413` | `FILE_TOO_LARGE` | Limite configurado excedido. |
| `500` | `UPLOAD_FAILED` | Falha não recuperável ao gravar arquivo ou metadados. |

### `GET /documents`

**Entrada:** sem parâmetros obrigatórios ou paginação no MVP.

**Sucesso:** `200 OK`, lista em ordem decrescente de `uploadedAt` e depois crescente de `id`.

```json
{
	"documents": [
		{
			"id": "b3c8f7c4-7b1c-4b0b-8d59-4d8d5f6f6e13",
			"originalName": "relatorio.pdf",
			"size": 24810,
			"uploadedAt": "2026-09-29T12:00:00.000Z",
			"owner": "local"
		}
	]
}
```

Sem documentos, responder `200 OK` com `{ "documents": [] }`. A listagem reflete apenas os metadados disponíveis no processo atual.

### `GET /documents/:id/download`

**Entrada:** `id` UUID do documento. Não aceitar caminho ou nome de arquivo como identificador.

**Sucesso:** `200 OK`, bytes do arquivo, `Content-Disposition: attachment` com `originalName` sanitizado e `Content-Type: application/octet-stream` no MVP. Não retornar metadados JSON no corpo.

**Erros:** `404 DOCUMENT_NOT_FOUND` quando o id não existir no catálogo atual; `404 FILE_NOT_FOUND` quando houver metadado, mas o arquivo não estiver acessível; `500 DOWNLOAD_FAILED` em falha inesperada de leitura. A resposta não revela o caminho do arquivo.

### Erros comuns

| HTTP | Código | Uso |
| --- | --- | --- |
| `400` | `INVALID_REQUEST` | Entrada malformada que não tenha código mais específico. |
| `404` | `DOCUMENT_NOT_FOUND` | Documento não cadastrado no processo atual. |
| `500` | `INTERNAL_ERROR` | Falha inesperada não classificada; detalhes ficam apenas no log do servidor. |

## 7. Arquitetura e decisões

### Backend

- `routes/`: registra caminhos HTTP, aplica middleware de upload e delega ao controller.
- `controllers/`: traduz requisição/resposta HTTP, lê o arquivo processado pelo Multer e mapeia erros para códigos HTTP; não contém regra de negócio ou persistência.
- `services/`: valida regras do caso de uso, coordena upload, listagem e download e define a ordem de gravação/compensação.
- `repositories/`: abstrai a coleção de metadados em memória e o acesso ao filesystem local. Não depende de Express.
- Multer deve usar `diskStorage` apontando para o diretório local configurado; o nome físico deve ser gerado no servidor. Middleware não substitui validação de tamanho e tratamento de falhas no controller/service.

### Frontend

- React com componentes funcionais e separação coerente entre páginas, componentes e serviços.
- Comunicação por `fetch` via prefixo `/api`, com tratamento de respostas não-2xx e de falhas de rede.
- O proxy configurado no Vite é apenas para desenvolvimento. Implantação deve mapear o prefixo `/api` para as rotas backend sem prefixo, ou adaptar a configuração de forma equivalente.

### Estado atual do repositório

- O backend Express implementa apenas `GET /health`; os endpoints definidos nesta especificação ainda são planejados.
- As camadas `routes`, `controllers`, `services` e `repositories` ainda não contêm a implementação dos casos de uso do DMS.
- O frontend é uma tela placeholder e o teste backend existente é somente de fumaça.
- Multer está disponível como dependência, mas o `diskStorage` ainda precisa ser configurado na etapa de implementação.

## 8. Plano de execução

As etapas abaixo são uma sequência futura de trabalho. Esta entrega contém apenas a especificação; não inclui a execução nem a alteração de arquivos de backend ou frontend.

1. **Aprovar decisões do MVP:** confirmar semântica de `owner`, limite de upload e eventual allowlist de tipos; revisar contratos e critérios de aceite.
2. **Implementar backend:** criar rotas, controllers, services e repositories; configurar Multer `diskStorage` em `backend/storage`; implementar upload, listagem, download, validações e mapeamento de erros conforme os contratos.
3. **Testar backend:** cobrir sucesso e falhas de cada endpoint, isolamento de caminhos, limite de tamanho, limpeza após falha, ordenação e comportamento de catálogo após reinício usando filesystem temporário nos testes.
4. **Implementar frontend:** substituir placeholder por fluxo de upload, listagem e download; usar os contratos via `/api`; apresentar estados de carregamento, lista vazia, sucesso e erro.
5. **Integrar e validar:** executar testes backend e build frontend, verificar proxy/API ponta a ponta em desenvolvimento e atualizar README com execução e configuração local.
6. **Revisar segurança e operação:** confirmar que nenhum provedor externo foi introduzido, que nomes físicos não são controlados pelo cliente, que os erros não vazam caminhos e que limitações de persistência estão documentadas.

## 9. Pendências antes da implementação

- Confirmar se `DMS_DEFAULT_OWNER` é suficiente para o MVP sem autenticação ou se gestão por usuário exige identidade e autorização já nesta fase.
- Aprovar o padrão de 10 MiB e decidir se será adotada uma allowlist de extensões/MIME; o valor de MIME enviado pelo cliente não pode ser tratado como prova do conteúdo.
- Definir em ambiente de produção o encaminhamento do prefixo `/api`.
- Definir posteriormente política de limpeza/reconstrução de arquivos órfãos e persistência de metadados caso seja necessária durabilidade entre reinicializações.