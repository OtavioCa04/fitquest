# FitQuest

App funcional com React, Vite, Express e MySQL.

## Como Rodar

Pre-requisitos:

- Node.js 18+
- MySQL ligado em `localhost:3306`

Instale as dependencias:

```bash
npm install
```

Copie `.env.example` para `.env.local` e configure o banco:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=fitquest
```

Rode o app:

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

O servidor cria automaticamente o banco `fitquest` e as tabelas `users` e `workouts`. Se quiser criar manualmente no phpMyAdmin ou MySQL Workbench, use o arquivo `database.sql`.

## Funcionalidades

- Cadastro cria usuario novo no MySQL.
- Login busca o usuario no MySQL e valida a senha.
- Senhas ficam salvas com hash PBKDF2, nao em texto puro.
- Sessao usa token Bearer salvo no `localStorage` e persistido na tabela `sessions`.
- Sessoes expiram em 30 dias.
- Login/cadastro tem rate limit de 10 tentativas por IP a cada 15 minutos.
- Treinos sao gravados no MySQL vinculados ao usuario logado.
- Cada treino gera XP: Leve 25, Moderado 50, Intenso 75.
- Senha de cadastro exige 8 caracteres, letra maiuscula, numero e caractere especial.
- Dashboard mostra ultimos treinos, sequencia, XP e total por usuario.
- Dias de treino contam datas unicas: varios treinos no mesmo dia contam como 1 dia.
- Perfil salva nome, telefone, bio e foto em base64 no MySQL.
- Conquistas sao calculadas a partir dos treinos e XP do usuario.
- Dashboard so abre depois de login/cadastro real.

## API

| Metodo | Endpoint | Descricao |
| --- | --- | --- |
| GET | `/api/health` | Testa API e conexao com MySQL |
| POST | `/api/auth/register` | Cria conta |
| POST | `/api/auth/login` | Autentica conta |
| POST | `/api/auth/logout` | Encerra sessao |
| GET | `/api/me` | Retorna usuario logado |
| PATCH | `/api/me` | Atualiza perfil, bio e foto |
| GET | `/api/dashboard` | Retorna perfil, treinos e conquistas |
| GET | `/api/workouts` | Lista treinos do usuario logado |
| POST | `/api/workouts` | Cria treino para o usuario logado |

## Scripts

| Comando | Acao |
| --- | --- |
| `npm run dev` | Inicia Express + Vite |
| `npm run build` | Gera build de producao |
| `npm run lint` | Verifica TypeScript |
| `npm run test` | Roda testes unitarios |
