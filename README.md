<p align="center">
    <img src="logo-bg.jpg" alt="Project Logo" />
</p>

<h1 align="center">EuBit</h1>

A EuBit é uma plataforma de diário digital que permite aos seus utilizadores partilhar momentos da sua vida.

## Conceito

Cada utilizador possui um perfil e pode criar publicações onde pode inserir vários dados, desde um título, a categoria (Viagem, Académico, Desporto, entre outros...), ficheiros associados à publicação e, dependendo da categoria escolhida, outros detalhes, como lista de locais em cado de Viagem.

Cada utilizador possui o seu perfil onde são apresentadas as suas publicações. As publicações podem ser públicas ou privadas e ao visitar o perfil de um outro utilizador, apenas são apresentadas as publicações públicas.

Assim, os utilizadores podem construir o seu diário digital e partilhar com outros utilizadores.

## Implementação

Esta aplicação foi dividida em 3 partes:

- Frontend
- Backend
- Auth

Para executar a aplicação, é necessário iniciar os 3, assim como ter a base de dados em MongoDB configurada.

### Frontend

Para construír a interface decidimos utilizar Vue, uma ferramenta à qual já estávamos mais habituados. Construímos as páginas, definimos as rotas e utilizamos [Stores](https://pinia.vuejs.org/) para gerir os dados obtidos do lado do cliente.

Para executar este serviço em `/frontend`:

- `npm install`
- `npx vite`

O serviço será executado em `http://localhost:5173`.

### Backend

Este serviço é responsável responder a pedidos de dados das publicações e logs.

Quando um há transferência de ficheiros envolvida, é necessário assegurar a sua integridade.

Para isso implementamos um sistema inspirado no [Bagit](https://datatracker.ietf.org/doc/rfc8493/) onde um manifesto contém a lista de ficheiros que é suposto ir no ficheiro zip partilhado, assim como a checksum de cada um.

Quem envia, constrói o manifesto com as informações necessárias e cria o zip com o manifesto e os ficheiros a enviar.

O recetor do zip, ao descompactar, consulta o manifesto e verifica se todos os ficheiros estão presentes e a sua checksum para garantir que não foram alterados, garantindo assim a integridade da transferência.

Para executar este serviço em `/backend`:

- `npm install`
- `npm start`

O serviço será executado em `http://localhost:14000`.

### Auth

Também existe a noção de administrador que é responsável por, para além de todas as funcionalidade já disponíveis, também gerir os utilizador, nomeadamente apagar e banir um utilizador do feed principal.

Este serviço de autenticação é responsável por processar os logins e registos dos utilizadores, criando um token JWT neste processo que fica associado ao utilizador.

Também é responsável por, verificar esse token para garantir a autenticação de quem fez o pedido, e também a autorização de admin, se for o caso.

Com recurso ao [passport](https://www.passportjs.org/), foi possível incluír também a autenticação com o Google, para a qual foi necessário registar a aplicação na Google Cloud.

Este serviço também responde a pedidos de dados relativos a utilizadores, como a lista dos utilizadores da aplicação, dados sobre um específico ou alteração de um já existente.

Para executar este serviço em `/auth`:

- `npm install`
- `npm start`

O serviço será executado em `http://localhost:13000`.

### Base de Dados

Para armazenar as informações foi criada uma base de dados em MongoDB a correr num container docker.

A base de dados *EWprojeto* possui várias coleções para armazenar os diversos dados que a aplicação precisa.

Para correr a aplicação é necessário ter este serviço a correr também, na porta, tanto externa quanto interna, **27017**.
