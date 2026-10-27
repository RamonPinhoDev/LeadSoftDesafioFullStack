import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Services, cpfValido, mensagemErro } from './services';

describe('Services / LeadSoft', () => {
  let service: Services;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Services);
    service.sair();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    service.sair();
    delete window.grecaptcha;
    vi.restoreAllMocks();
  });
  it('valida os dois dígitos do CPF e recusa sequências repetidas', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
    expect(cpfValido('11144477735')).toBe(true);
    for (const invalido of [
      '52998224724',
      '52998224715',
      '11111111111',
      '00000000000',
      '',
      '123456789',
    ])
      expect(cpfValido(invalido)).toBe(false);
  });
  it('recusa e-mail duplicado sem diferenciar maiúsculas', async () => {
    const resultado = service.validarUnicidade('52998224725', 'PESSOA@example.com');
    const verificacao = expect(resultado).rejects.toThrow('e-mail já está cadastrado');
    http.expectOne('/api/Usuarios/Get').flush([{ id: '1', email: 'pessoa@example.com' }]);
    await verificacao;
  });
  it('consulta os detalhes para detectar CPF duplicado', async () => {
    const resultado = service.validarUnicidade('52998224725', 'novo@example.com');
    const verificacao = expect(resultado).rejects.toThrow('CPF já está cadastrado');
    http.expectOne('/api/Usuarios/Get').flush([{ id: '1', email: 'outro@example.com' }]);
    await Promise.resolve();
    http.expectOne('/api/Usuarios/Get/1').flush({ cpf: '529.982.247-25' });
    await verificacao;
  });
  it('impede inscrição com o endereço reservado do administrador', async () => {
    await expect(service.validarUnicidade('52998224725', service.adminEmail)).rejects.toThrow(
      'reservado',
    );
    http.expectNone('/api/Usuarios/Post');
  });
  it('envia multipart com os nomes e parâmetros exatos da API', async () => {
    const imagem = new File(['png'], 'foto.png', { type: 'image/png' });
    const resultado = firstValueFrom(service.enviarFoto('users/1', 'Minha legenda', imagem));
    const req = http.expectOne((r) => r.url === '/api/Arquivo/AnexarArquivoService');
    expect(req.request.params.get('IdUsuario')).toBe('users/1');
    expect(req.request.params.get('ImagemLgenda')).toBe('Minha legenda');
    expect(req.request.body.get('Imagem').name).toMatch(/\.png$/);
    expect(req.request.body.get('Imagem').size).toBe(imagem.size);
    expect(req.request.body.get('Imagem').type).toBe('image/png');
    expect(req.request.headers.has('Content-Type')).toBe(false);
    req.flush('');
    await resultado;
  });
  it('identifica o erro de armazenamento retornado em texto no upload sem expor detalhes internos', () => {
    const mensagem = mensagemErro(
      new HttpErrorResponse({
        status: 400,
        error: JSON.stringify({
          title: 'Erro ao acessar arquivo',
          detail: 'Stack trace e caminho interno',
        }),
      }),
    );
    expect(mensagem).toContain('armazenamento de fotos');
    expect(mensagem).not.toContain('Stack trace');
  });
  it('não inventa IDs de mídia ausentes na galeria', async () => {
    const resultado = firstValueFrom(service.carregarGaleria());
    http.expectOne('/api/Usuarios/Get').flush([{ id: '1', nome: 'Autor', email: 'p@example.com' }]);
    http
      .expectOne('/api/Arquivo/BuscarArquivoService/1')
      .flush([{ imagem: 'AAAA', imagemLgenda: 'Legenda' }]);
    const fotos = await resultado;
    expect(fotos[0].autor).toBe('Autor');
    expect(fotos[0].mediaId).toBeUndefined();
  });
  it('usa imagemId retornado pela API para consultar e publicar comentários da foto', async () => {
    const resultado = firstValueFrom(service.listarFotos('users/1'));
    http.expectOne('/api/Arquivo/BuscarArquivoService/users%2F1').flush([
      { imagemId: 'foto-real', imagem: 'AAAA', imagemLgenda: 'teste' },
      { mediaId: 'manter-id', imagemId: 'outro-id', imagem: 'BBBB', imagemLgenda: 'Outra' },
      { imagem: 'CCCC', imagemLgenda: 'Sem ID' },
    ]);
    const fotos = await resultado;
    expect(fotos.map((foto) => foto.mediaId)).toEqual(['foto-real', 'manter-id', undefined]);
    const consulta = firstValueFrom(service.listarComentarios(fotos[0].mediaId!));
    const reqConsulta = http.expectOne((req) => req.url === '/api/Comentario');
    expect(reqConsulta.request.params.get('MediaId')).toBe('foto-real');
    reqConsulta.flush([]);
    await consulta;
    const envio = firstValueFrom(service.comentar(fotos[0].mediaId!, 'Meu comentário'));
    const reqEnvio = http.expectOne('/api/Comentario');
    expect(reqEnvio.request.method).toBe('POST');
    expect(reqEnvio.request.body).toEqual({ mediaId: 'foto-real', coment: 'Meu comentário' });
    reqEnvio.flush('Comentário criado');
    await envio;
  });
  it('bloqueia exclusões sem sessão', () => {
    expect(() => service.excluirCandidato('1')).toThrow('sessão expirou');
    expect(() => service.excluirComentario('1')).toThrow('sessão expirou');
  });
  it('preserva comentarioId retornado pela API e usa esse ID no DELETE', async () => {
    vi.spyOn(service, 'estaAutenticado').mockReturnValue(true);
    const lista = firstValueFrom(service.listarComentarios('foto-real'));
    http
      .expectOne((req) => req.url === '/api/Comentario')
      .flush([
        {
          comentarioId: 'comentarios/123',
          mediaId: 'foto-real',
          coment: 'Texto',
          dataCriacao: '2026-10-27',
        },
      ]);
    const comentarios = await lista;
    const exclusao = firstValueFrom(service.excluirComentario(comentarios[0].comentarioId!));
    const req = http.expectOne('/api/Comentario/comentarios%2F123');
    expect(req.request.method).toBe('DELETE');
    req.flush('Comentário excluído com sucesso.');
    await exclusao;
  });
  it('não chama Login quando o servidor recusa o reCAPTCHA', async () => {
    window.grecaptcha = { ready: (callback) => callback(), execute: async () => 'token-teste' };
    const resultado = service.entrar(service.adminEmail, 'senha-teste');
    const verificacao = expect(resultado).rejects.toThrow('Verificação de segurança recusada');
    await vi.waitFor(() => {
      const req = http.expectOne((r) => r.url === '/api/Usuarios/ReCaptchaPassed');
      expect(req.request.params.get('gRecaptchaResponse')).toBe('token-teste');
      req.flush(false);
    });
    await verificacao;
    http.expectNone('/api/Usuarios/Login');
    expect(service.estaAutenticado()).toBe(false);
  });
  it('cria cookie de sessão somente após reCAPTCHA aceito e Login HTTP 200', async () => {
    const escreverCookie = vi.spyOn(document, 'cookie', 'set');
    window.grecaptcha = { ready: (callback) => callback(), execute: async () => 'token-teste' };
    const resultado = service.entrar(service.adminEmail, 'senha-teste');
    await vi.waitFor(() =>
      http.expectOne((r) => r.url === '/api/Usuarios/ReCaptchaPassed').flush(true),
    );
    await vi.waitFor(() => {
      const req = http.expectOne('/api/Usuarios/Login');
      expect(req.request.body.senha).toBe('senha-teste');
      expect(service.estaAutenticado()).toBe(false);
      req.flush({ id: 'admin', email: service.adminEmail });
    });
    await resultado;
    expect(service.estaAutenticado()).toBe(true);
    const cookie = escreverCookie.mock.calls.find(([valor]) =>
      valor.startsWith('leadsoft_sessao=1'),
    )?.[0];
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).not.toMatch(/expires=|max-age=/i);
    expect(cookie).not.toContain('senha-teste');
    const outraInstancia = TestBed.runInInjectionContext(() => new Services());
    expect(outraInstancia.estaAutenticado()).toBe(true);
    service.sair();
    expect(service.estaAutenticado()).toBe(false);
  });
  it('aceita HTTP 200 mesmo com corpo vazio, conforme o contrato solicitado', async () => {
    window.grecaptcha = { ready: (callback) => callback(), execute: async () => 'token-teste' };
    const resultado = service.entrar(service.adminEmail, 'senha-teste');
    await vi.waitFor(() =>
      http.expectOne((r) => r.url === '/api/Usuarios/ReCaptchaPassed').flush(true),
    );
    await vi.waitFor(() =>
      http.expectOne('/api/Usuarios/Login').flush(null, { status: 200, statusText: 'OK' }),
    );
    await resultado;
    expect(service.estaAutenticado()).toBe(true);
  });
  it('não cria cookie quando o Login retorna erro', async () => {
    window.grecaptcha = { ready: (callback) => callback(), execute: async () => 'token-teste' };
    const resultado = service.entrar(service.adminEmail, 'senha-teste');
    const verificacao = expect(resultado).rejects.toBeTruthy();
    await vi.waitFor(() =>
      http.expectOne((r) => r.url === '/api/Usuarios/ReCaptchaPassed').flush(true),
    );
    await vi.waitFor(() =>
      http
        .expectOne('/api/Usuarios/Login')
        .flush('Falha', { status: 401, statusText: 'Unauthorized' }),
    );
    await verificacao;
    expect(service.estaAutenticado()).toBe(false);
  });
  it('exige exatamente HTTP 200 antes de criar o cookie', async () => {
    window.grecaptcha = { ready: (callback) => callback(), execute: async () => 'token-teste' };
    const resultado = service.entrar(service.adminEmail, 'senha-teste');
    const verificacao = expect(resultado).rejects.toThrow('API não confirmou');
    await vi.waitFor(() =>
      http.expectOne((r) => r.url === '/api/Usuarios/ReCaptchaPassed').flush(true),
    );
    await vi.waitFor(() =>
      http.expectOne('/api/Usuarios/Login').flush('', { status: 201, statusText: 'Created' }),
    );
    await verificacao;
    expect(service.estaAutenticado()).toBe(false);
  });
});
