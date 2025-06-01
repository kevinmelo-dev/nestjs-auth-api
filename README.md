# NEST.JS AUTH API

API de autenticação robusta construída com NestJS, utilizando login local (email/senha) e social (Google e Facebook). O projeto gerencia autenticação via JWT (JSON Web Tokens) e protege rotas utilizando Guards e Strategies do Passport.js, com persistência de dados em PostgreSQL via Prisma ORM.

## Sumário

* [Funcionalidades](#funcionalidades)
* [Tecnologias Utilizadas](#tecnologias-utilizadas)
* [Estrutura do Projeto](#estrutura-do-projeto)
* [Pré-requisitos](#pré-requisitos)
* [Configuração do Ambiente](#configuração-do-ambiente)
* [Instalação e Execução](#instalação-e-execução)
* [Endpoints da API](#endpoints-da-api)
* [Testes](#testes)
* [Licença](#licença)

## Funcionalidades

* Cadastro de Usuários
* Autenticação Local (email e senha)
* Login com Google
* Login com Facebook
* Gerenciamento de JWT (JSON Web Tokens)
* Gerenciamento de Perfil do Usuário (visualização e atualização do próprio perfil, visualização de perfis públicos)
* Rotas Protegidas

## Tecnologias Utilizadas

* Backend: NestJS
* Banco de Dados: PostgreSQL
* ORM: Prisma
* Autenticação: Passport.js (Estratégias Local, JWT, Google OAuth 2.0, Facebook OAuth 2.0)
* Validação: class-validator
* Containerização: Docker (para o banco de dados PostgreSQL)
* Linguagem: TypeScript
* Gerenciador de Pacotes: npm (v11.3.0)
* Ambiente de Execução: Node.js (v22.14.0)

## Estrutura do Projeto

O projeto segue a estrutura padrão de aplicações NestJS, com os principais diretórios e arquivos organizados da seguinte forma:

```text
.
├── prisma/                 # Arquivos do Prisma ORM
│   ├── migrations/         # Migrações do banco de dados
│   └── schema.prisma       # Schema do banco de dados
├── src/                    # Código fonte da aplicação
│   ├── auth/               # Módulo de autenticação
│   │   ├── dto/            # Data Transfer Objects para autenticação
│   │   ├── guards/         # Guards de autenticação (Local, JWT, Google, Facebook)
│   │   ├── strategies/     # Estratégias do Passport.js
│   │   ├── interfaces/     # Interfaces (ex: payload JWT)
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── users/              # Módulo de usuários
│   │   ├── dto/            # Data Transfer Objects para usuários
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── prisma/             # Módulo e serviço do Prisma (se customizado, geralmente na raiz ou em um módulo 'database')
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts             # Ponto de entrada da aplicação
├── test/                   # Testes End-to-End (E2E)
│   ├── app.e2e-spec.ts
│   └── auth.e2e-spec.ts
├── .env.example            # Arquivo de exemplo para variáveis de ambiente
├── .gitignore
├── docker-compose.yml      # Arquivo para subir o container do PostgreSQL
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```
*(Esta é uma representação simplificada. Consulte os prints da estrutura para mais detalhes sobre subpastas como `dto`, `guards`, `strategies` dentro de cada módulo).*

## Pré-requisitos

* Node.js (v22.14.0 ou superior)
* npm (v11.3.0 ou superior)
* Docker

## Configuração do Ambiente

### Variáveis de Ambiente

1.  Copie `.env.example` para `.env`.
2.  Preencha as variáveis no arquivo `.env`:

    ```dotenv
    PORT=3000

    POSTGRES_USER=example_user
    POSTGRES_PASSWORD=example_password
    POSTGRES_DB=example_db
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"

    JWT_SECRET="seu_jwt_secret_aqui"
    JWT_EXPIRATION_TIME="3600s"

    GOOGLE_CLIENT_ID="seu_google_client_id_aqui"
    GOOGLE_CLIENT_SECRET="seu_google_client_secret_aqui"
    GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"

    FACEBOOK_APP_ID="seu_facebook_app_id_aqui"
    FACEBOOK_APP_SECRET="seu_facebook_app_secret_aqui"
    FACEBOOK_CALLBACK_URL="http://localhost:3000/api/v1/auth/facebook/callback"
    ```

### Configuração dos Provedores OAuth

* **Google:** Configure um ID de cliente OAuth 2.0 no Google Cloud Console e adicione a `GOOGLE_CALLBACK_URL` às URIs de redirecionamento autorizadas.
* **Facebook:** Crie um App no Facebook for Developers, configure o Login do Facebook e adicione a `FACEBOOK_CALLBACK_URL` às URIs de redirecionamento OAuth válidos.

## Instalação e Execução

1.  **Clone o repositório:**
    ```bash
    git clone <https://github.com/kevinmelo-dev/nestjs-auth-api.git>
    cd nestjs-auth-api
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o arquivo `.env`.**

4.  **Inicie o container do PostgreSQL:**
    ```bash
    docker-compose up -d
    ```

5.  **Execute as migrações do Prisma:**
    ```bash
    npx prisma migrate dev
    ```

6.  **Inicie a aplicação:**
    ```bash
    npm run start:dev
    ```
    API disponível em: `http://localhost:3000/api/v1`

7.  **(Opcional) Prisma Studio:**
    ```bash
    npx prisma studio
    ```

## Endpoints da API

Todos os endpoints usam o prefixo `/api/v1`.

### Autenticação (`/auth`)

* **`POST /register`**: Registra um novo usuário.
    * Corpo: `{ "name": "...", "email": "...", "password": "..." }`
* **`POST /login`**: Autentica um usuário local.
    * Corpo: `{ "email": "...", "password": "..." }`
* **`GET /google`**: Redireciona para login com Google.
* **`GET /google/callback`**: Callback do Google. Retorna JWT.
* **`GET /facebook`**: Redireciona para login com Facebook.
* **`GET /facebook/callback`**: Callback do Facebook. Retorna JWT.

### Usuários (`/users`)

* **`GET /me`**: Retorna perfil do usuário logado (Requer JWT).
* **`PATCH /update`**: Atualiza perfil do usuário logado (Requer JWT).
    * Corpo: `{ "name": "..." (e outros campos atualizáveis) }`
* **`GET /:username`**: Retorna perfil público de um usuário.

## Testes

* Testes unitários/integração:
    ```bash
    npm run test
    ```
* Testes End-to-End:
    ```bash
    npm run test:e2e
    ```

## Licença

Este projeto é licenciado sob a Licença MIT.

---

Feito por [Kevin Melo/https://github.com/kevinmelo-dev]
```