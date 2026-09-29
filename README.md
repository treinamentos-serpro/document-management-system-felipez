# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey felipezschornack!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-serpro/document-management-system-felipez/issues/1)

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

## Execução local

Configure pelo menos um usuário antes de iniciar o backend. Cada valor deve ser
um token único com pelo menos 32 caracteres; tokens reais devem vir de um
gerenciador de segredos e não devem ser commitados.

```sh
cd backend
export DMS_USER_TOKENS='{"alice":"substitua-por-um-segredo-aleatorio-com-32-caracteres-ou-mais"}'
npm install
npm run dev
```

Em outro terminal, inicie o frontend e informe o token configurado na tela:

```sh
cd frontend
npm install
npm run dev
```

O frontend mantém o token apenas na memória da sessão. O backend limita cada
arquivo a 10 MB por padrão, o storage a 1 GB e cada usuário a 500 documentos;
os limites podem ser ajustados por `MAX_FILE_SIZE_MB`, `MAX_STORAGE_MB` e
`MAX_DOCUMENTS_PER_OWNER`. Os metadados continuam em memória nesta fase e são
perdidos ao reiniciar o processo.

