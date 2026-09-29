# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey felipezschornack!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-serpro/document-management-system-felipez/issues/1)

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

## Execução local

Configure os usuários e tokens antes de iniciar o backend. O objeto JSON usa o
identificador do usuário como chave e o token Bearer como valor:

```sh
cd backend
export DMS_USER_TOKENS='{"alice":"substitua-por-um-token-longo"}'
npm install
npm run dev
```

Em outro terminal, inicie o frontend:

```sh
cd frontend
npm install
npm run dev
```

Abra o endereço informado pelo Vite e informe o token configurado. Os tokens
devem ser secretos e não devem ser commitados. O frontend os mantém apenas na
memória da sessão. Para produção, use HTTPS e substitua tokens estáticos por um
provedor de identidade apropriado.

Os uploads são limitados a 10 MB e armazenados localmente em `backend/storage`.
Os metadados permanecem em memória nesta fase: reiniciar o backend perde a
listagem e os arquivos já gravados podem ficar órfãos. Esse comportamento é uma
limitação conhecida do armazenamento inicial.

## Verificações

```sh
cd backend && npm test
cd ../frontend && npm run build
```

