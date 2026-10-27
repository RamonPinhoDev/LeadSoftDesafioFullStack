# LeadSoftDesafioFullStack

Desafio full stack com API em ASP.NET Core e frontend Angular, com cadastro de candidatos, fotos, comentários e painel de administração.

## Projetos

- `LeadSoftDesafioBackend/`: solução .NET 10 com API, aplicação, domínio e infraestrutura RavenDB.
- `LeadSoftDesafioFrontEnd/`: aplicação Angular 22 com interface branca e detalhes azuis.
- `EvidenciasRavenDB/`: pasta para evidências do banco.
- `LeadSoft - Desafio Full Stack.pdf`: enunciado do desafio.
- `configuracao/appsettings.example.json`: modelo de configuração da API, sem a chave secreta.

## Executar a API

Requer .NET SDK 10 e acesso ao RavenDB utilizado pelo projeto, incluindo o certificado configurado na infraestrutura existente.

Copie `configuracao/appsettings.example.json` para `LeadSoftDesafioBackend/LeadSoftDesafio.API/appsettings.json` e configure a chave secreta do reCAPTCHA localmente. O arquivo de configuração real e certificados não são versionados.

```powershell
Copy-Item configuracao/appsettings.example.json LeadSoftDesafioBackend/LeadSoftDesafio.API/appsettings.json
$env:Recaptcha__SecretKey = 'SUA_CHAVE_SECRETA'
dotnet run --project LeadSoftDesafioBackend/LeadSoftDesafio.API --launch-profile https
```

A API utiliza `https://localhost:7138`. A configuração do RavenDB e o caminho do certificado estão no código existente da infraestrutura; o envio ao GitHub não os altera.

## Executar o frontend

Requer Node.js compatível com Angular 22.

```powershell
cd LeadSoftDesafioFrontEnd
npm ci
npm start
```

Abra `http://localhost:4200`. O proxy de desenvolvimento encaminha `/api` para a API em `https://localhost:7138`.

O login utiliza reCAPTCHA v3. O domínio usado precisa estar autorizado na configuração da chave no Google. O cadastro pode ser acessado pelo link da página de login.

## Validar o frontend

```powershell
cd LeadSoftDesafioFrontEnd
npm test -- --watch=false
npm run build
```

A última validação do frontend passou em 53 testes e no build de produção. Os testes de escrita usam mocks. Mais detalhes da implementação estão no README do frontend.
