# Galeria criativa LeadSoft

Frontend Angular do desafio, implementado em `D:\Udemy\LEADSOFT TESTE\LeadSoftDesafioFrontEnd` com fundo branco e detalhes azuis. Nenhum componente ou serviço adicional foi criado. A API em `D:\Udemy\LEADSOFT TESTE\LeadSoftDesafioBackend` foi apenas consultada e executada com `--no-build`; seus arquivos não foram editados.

## Executar

1. Inicie a API existente com o perfil HTTPS, em `https://localhost:7138`.
2. Neste diretório, execute `npm install` se as dependências ainda não estiverem disponíveis.
3. Execute `npm start` e abra `http://localhost:4200`.

O `proxy.conf.json` encaminha `/api/**` para o endereço HTTPS do perfil existente, evitando depender de CORS no desenvolvimento. `secure: false` se aplica somente ao certificado local de desenvolvimento. A publicação precisa encaminhar `/api` para a mesma API no servidor web; o proxy do Angular não é incluído no build de produção.

Página inicial: `/login`, com o link **Ainda não tem cadastro? Cadastre-se** para a página `/cadastro`, acessível sem autenticação. As rotas `/galeria`, `/admin` e `/admin/candidato/:id` exigem o cookie de sessão. O menu apresenta **Cadastrar** após a autenticação.

## Reaproveitamento

Foram utilizados somente os quatro componentes e o serviço que já existiam neste projeto:

| Componente existente | Responsabilidade                                      |
| -------------------- | ----------------------------------------------------- |
| `Cadastro`           | Cadastro de usuário, CPF, nascimento, e-mail e senha  |
| `Galeria`            | Galeria após login, busca e interface de comentários  |
| `Login`              | Login com reCAPTCHA v3                                |
| `Candidatos`         | Listagem, detalhes, dados pessoais, fotos e exclusões |
| `Services`           | Chamadas à API, verificação de duplicidade e sessão   |

Nenhuma dependência foi adicionada. O Tailwind existente foi mantido; os estilos e controles usados nas telas estão no próprio frontend.

## Comportamentos

- CPF validado pelos dois dígitos verificadores; rejeita sequências repetidas.
- Verificação de CPF e e-mail já cadastrados usando a listagem e os detalhes da API.
- Nascimento válido entre 01/01/1900 e o dia atual.
- O cadastro envia apenas nome, CPF, e-mail, data de nascimento e senha ao endpoint existente `/api/Usuarios/Post`. Não exige legenda nem foto e não chama o endpoint de arquivos.
- Em **Painel → Ver detalhes → Adicionar foto**, selecione um PNG de exatamente 1080 × 1080 pixels, até 10 MB, e informe a legenda. O componente `Candidatos` reutiliza `Services.enviarFoto`, enviando o ID do candidato aberto em `IdUsuario` para `/api/Arquivo/AnexarArquivoService`. Após o envio, atualiza as fotos desse candidato. Em caso de falha, conserva a seleção e a legenda para nova tentativa. Nenhum componente, serviço ou endpoint adicional foi criado.
- Cada foto em **Detalhes do candidato** possui campo e botão **Publicar comentário**, reutilizando `Services.comentar`. O serviço normaliza o `imagemId` retornado pela API para `mediaId`, usado nos endpoints de comentários, sem inventar identificadores. O comentário aceita até 1000 caracteres, conserva o texto em caso de erro e atualiza a lista após o envio. O formulário também fica visível na galeria. O rótulo **Legenda da foto:** e a legenda aparecem em linhas separadas, antes do título **Comentários** e dos comentários com data. O aviso de indisponibilidade destacado foi removido.
- A lista de comentários também consulta novos registros a cada 5 segundos na foto aberta da galeria e nas fotos dos detalhes do candidato, sem apagar rascunhos ou recarregar dados pessoais. A consulta pausa com a página oculta e termina ao sair da tela. Respostas antigas não sobrescrevem atualizações feitas após uma publicação ou exclusão.
- O botão **Excluir** solicita confirmação junto ao comentário clicado e usa o `comentarioId` retornado pela API no DELETE existente. Após sucesso, remove o item da lista; respostas temporariamente desatualizadas não o fazem reaparecer. Comentários sem identificador real exibem erro em vez de enviar uma exclusão com ID incorreto.
- O frontend não armazena CPF, senha ou dados pessoais no cookie nem em localStorage/sessionStorage. Após reCAPTCHA aceito e resposta HTTP **200** de `/api/Usuarios/Login`, grava `leadsoft_sessao=1`, com `Path=/` e `SameSite=Strict` (`Secure` em HTTPS). O corpo da resposta pode ser vazio. Sem o cookie, a navegação redireciona ao login. **Sair** remove o cookie.
- O cookie é de sessão, sem `Expires` ou `Max-Age`. Além disso, o evento `pagehide` remove o cookie no encerramento da página. Isso limpa a sessão ao fechar a janela e também ao atualizar com F5 ou sair do aplicativo por uma navegação completa. A navegação interna pelo menu Angular conserva a sessão. Não há evento de fechamento infalível em caso de encerramento forçado do processo; o cookie de sessão é a proteção complementar. [Documentação de cookies de sessão](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#expiresdate).
- O cadastro solicita uma senha de acesso de 8 a 128 caracteres, enviada no campo `senha` de `/api/Usuarios/Post`, já existente. O login envia o e-mail e a senha informados para `/api/Usuarios/Login`. Nenhuma senha é embutida no código nem guardada no cookie. A conta administrativa fornecida para o desafio precisa existir no banco; o frontend não a cria automaticamente.
- O item **Área restrita** foi removido da barra de navegação. Sem autenticação, ela exibe somente a marca com link ao login. Após autenticação, aparecem Galeria, Cadastrar, Painel e Sair.
- Chave pública de reCAPTCHA v3 informada aplicada ao script oficial. O token é gerado na ação `admin_login`, validado por `/api/Usuarios/ReCaptchaPassed`, e somente depois é chamado `/api/Usuarios/Login`. Sem verificação positiva, o painel não é liberado. O domínio utilizado precisa estar autorizado no cadastro da chave do Google.

Referência da integração: [documentação oficial reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3).

## Limitações encontradas na API, sem alterações

1. O login não emite token/cookie de autenticação e os endpoints não exigem autorização. O guard protege a navegação da interface, mas não garante restrição de acesso à API. O servidor também não vincula a verificação do reCAPTCHA ao login ou às operações administrativas.
2. A API não impõe unicidade de CPF/e-mail. A consulta no frontend evita duplicidades usuais, mas não impede requisições concorrentes ou chamadas diretas à API.
3. A listagem pública da API inclui e-mail e nascimento. Esses dados não são exibidos na galeria, mas a privacidade na rede depende do contrato do backend.
4. Excluir candidato usa somente o DELETE de usuário disponível. O repositório não remove explicitamente os documentos separados de mídia/comentários. A API não oferece operação para limpar esses documentos órfãos.

## Validação

Na consulta mais recente pelo proxy do frontend, a API de fotos retornou `imagemId`, `imagem` e `imagemLgenda`. O GET de comentários respondeu com `comentarioId`, `mediaId`, `coment` e `dataCriacao`, com identificadores preenchidos. O frontend utiliza esses campos para associar comentários e excluir pelo ID correto. O domínio `localhost` foi adicionado às configurações da chave de reCAPTCHA no Google; use `http://localhost:4200`. Nenhum arquivo da API foi alterado por esta implementação.

- `npm run build`: build de produção.
- `npm test -- --watch=false`: 53 testes aprovados em 6 arquivos. Cobre cookie após HTTP 200, proteção de rotas, envio e nova tentativa de fotos, comentários vinculados à foto, atualização automática, preservação de rascunhos, descarte de respostas antigas, confirmação de exclusão junto ao comentário e DELETE usando o identificador real. Operações de escrita são verificadas com mocks, sem excluir comentários reais durante os testes.
- Galeria conferida com as três fotos reais retornadas pela API local.
- Cadastro centralizado em uma coluna, somente com dados pessoais e senha. A seção Sua criação, legenda, contador de caracteres e foto foram removidos da tela e do fluxo de envio.
- Visitantes que tentam abrir `/galeria`, `/admin` ou detalhes são encaminhados a `/login`. O cadastro pode ser aberto pelo link da tela de login.
- Testes de cadastro e exclusão usam mocks; não criam nem removem registros da base real.

## Correção do diretório

As alterações feitas anteriormente em `D:\Udemy\ProjetosKORP\KorpFrontEndTesteTecnico` foram desfeitas. As modificações que já existiam antes desta conversa foram preservadas. O build Korp restaurado voltou a gerar os mesmos arquivos e hashes da compilação inicial. O servidor anterior iniciado por esta conversa foi encerrado. O servidor em `http://127.0.0.1:4200` agora utiliza o projeto `LeadSoftDesafioFrontEnd`.
