import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Candidatos } from './candidatos';
import { Services } from '../../services/services/services';

describe('Painel administrativo', () => {
  let component: Candidatos;
  const candidato = {
    id: '1',
    nome: 'Pessoa',
    email: 'p@example.com',
    dataNascimento: '2000-01-01',
  };
  const service = {
    adminEmail: 'admin@example.com',
    estaAutenticado: vi.fn(),
    listarCandidatos: vi.fn(),
    excluirCandidato: vi.fn(),
  };
  beforeEach(() => {
    vi.resetAllMocks();
    service.estaAutenticado.mockReturnValue(true);
    service.listarCandidatos.mockReturnValue(of([candidato]));
    service.excluirCandidato.mockReturnValue(of(''));
    TestBed.configureTestingModule({
      imports: [Candidatos],
      providers: [provideRouter([]), { provide: Services, useValue: service }],
    });
    component = TestBed.createComponent(Candidatos).componentInstance;
  });
  it('não carrega dados pessoais sem sessão', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    service.estaAutenticado.mockReturnValue(false);
    await component.carregar();
    expect(service.listarCandidatos).not.toHaveBeenCalled();
  });
  it('exclui apenas a inscrição confirmada e atualiza a lista', async () => {
    await component.carregar();
    await component.excluir();
    expect(service.excluirCandidato).not.toHaveBeenCalled();
    component.confirmar.set(candidato);
    await component.excluir();
    expect(service.excluirCandidato).toHaveBeenCalledWith('1');
    expect(component.candidatos()).toHaveLength(0);
    expect(component.confirmar()).toBeNull();
  });
});

describe('Detalhes da inscrição', () => {
  let component: Candidatos;
  let fixtureDetalhes: ComponentFixture<Candidatos>;
  const service = {
    estaAutenticado: vi.fn(),
    buscarCandidato: vi.fn(),
    listarFotos: vi.fn(),
    listarComentarios: vi.fn(),
    excluirComentario: vi.fn(),
    enviarFoto: vi.fn(),
    comentar: vi.fn(),
  };
  beforeEach(() => {
    vi.resetAllMocks();
    service.estaAutenticado.mockReturnValue(true);
    service.buscarCandidato.mockReturnValue(
      of({
        id: '1',
        nome: 'Pessoa',
        email: 'p@example.com',
        cpf: '52998224725',
        dataNascimento: '2000-01-01',
      }),
    );
    service.listarFotos.mockReturnValue(of([{ imagem: 'AAAA', imagemLgenda: 'Legenda' }]));
    TestBed.configureTestingModule({
      imports: [Candidatos],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
        { provide: Services, useValue: service },
      ],
    });
    fixtureDetalhes = TestBed.createComponent(Candidatos);
    component = fixtureDetalhes.componentInstance;
  });
  it('carrega dados pessoais e fotos sem fabricar identificadores', async () => {
    await component.carregar();
    expect(component.candidato()?.cpf).toBe('52998224725');
    expect(component.fotos()).toHaveLength(1);
    expect(service.listarComentarios).not.toHaveBeenCalled();
  });
  it('não tenta excluir comentário sem ID', async () => {
    component.comentarioPendente.set({ mediaId: '1', coment: 'Texto', dataCriacao: '2000-01-01' });
    await component.excluirComentario();
    expect(service.excluirComentario).not.toHaveBeenCalled();
  });
  it('explica a falta de ID e exclui somente o comentário com identificador real confirmado', async () => {
    const semId = { mediaId: 'media/1', coment: 'Texto', dataCriacao: '2026-10-27' };
    component.solicitarExclusaoComentario(semId);
    expect(component.erro()).toContain('identificar este comentário');
    expect(component.comentarioPendente()).toBeNull();
    expect(service.excluirComentario).not.toHaveBeenCalled();
    const identificado = { ...semId, comentarioId: 'comentarios/1' };
    component.fotos.set([
      { mediaId: 'media/1', imagem: 'AAAA', imagemLgenda: 'Legenda', comentarios: [identificado] },
    ]);
    service.excluirComentario.mockReturnValue(of(''));
    component.solicitarExclusaoComentario(identificado);
    await component.excluirComentario();
    expect(service.excluirComentario).toHaveBeenCalledWith('comentarios/1');
    expect(component.fotos()[0].comentarios).toEqual([]);
    expect(component.comentarioPendente()).toBeNull();
    service.listarComentarios.mockReturnValue(of([identificado]));
    await component.atualizarComentarios();
    expect(component.fotos()[0].comentarios).toEqual([]);
  });
  it('confirma a exclusão junto do comentário clicado e remove o item após a resposta da API', async () => {
    const comentario = {
      comentarioId: 'comentarios/real',
      mediaId: 'media/1',
      coment: 'Excluir este',
      dataCriacao: '2026-10-27',
    };
    service.listarFotos.mockReturnValue(
      of([{ mediaId: 'media/1', imagem: 'AAAA', imagemLgenda: 'Legenda' }]),
    );
    service.listarComentarios.mockReturnValue(of([comentario]));
    service.excluirComentario.mockReturnValue(of(''));
    fixtureDetalhes.detectChanges();
    await vi.waitFor(() => expect(component.carregando()).toBe(false));
    fixtureDetalhes.detectChanges();
    const artigo = fixtureDetalhes.nativeElement.querySelector('.comment') as HTMLElement;
    (artigo.querySelector('.btn-delete') as HTMLButtonElement).click();
    fixtureDetalhes.detectChanges();
    expect(artigo.querySelector('.delete-confirm')).not.toBeNull();
    expect(service.excluirComentario).not.toHaveBeenCalled();
    (artigo.querySelector('.delete-confirm .btn-danger') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(component.excluindo()).toBe(false));
    fixtureDetalhes.detectChanges();
    expect(service.excluirComentario).toHaveBeenCalledWith('comentarios/real');
    expect(fixtureDetalhes.nativeElement.querySelector('.comment')).toBeNull();
  });
  it('atualiza somente os comentários sem perder o rascunho e pausa ao ocultar ou sair', async () => {
    vi.useFakeTimers();
    const visibilidade = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    try {
      service.listarFotos.mockReturnValue(
        of([{ mediaId: 'media/1', imagem: 'AAAA', imagemLgenda: 'Legenda' }]),
      );
      service.listarComentarios.mockReturnValue(of([]));
      fixtureDetalhes.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      component.fotos()[0].textoComentario = 'Rascunho';
      const novo = { mediaId: 'media/1', coment: 'Novo comentário', dataCriacao: '2026-10-27' };
      service.listarComentarios.mockReturnValue(of([novo]));
      await vi.advanceTimersByTimeAsync(5000);
      expect(component.fotos()[0].comentarios).toEqual([novo]);
      expect(component.fotos()[0].textoComentario).toBe('Rascunho');
      expect(service.buscarCandidato).toHaveBeenCalledTimes(1);
      expect(service.listarFotos).toHaveBeenCalledTimes(1);
      visibilidade.mockReturnValue('hidden');
      await vi.advanceTimersByTimeAsync(5000);
      expect(service.listarComentarios).toHaveBeenCalledTimes(2);
      component.ngOnDestroy();
      visibilidade.mockReturnValue('visible');
      await vi.advanceTimersByTimeAsync(5000);
      expect(service.listarComentarios).toHaveBeenCalledTimes(2);
    } finally {
      component.ngOnDestroy();
      visibilidade.mockRestore();
      vi.useRealTimers();
    }
  });
  it('publica o comentário na foto correta e atualiza seus comentários', async () => {
    service.listarFotos.mockReturnValue(
      of([
        { mediaId: 'media/1', imagem: 'AAAA', imagemLgenda: 'Primeira' },
        { mediaId: 'media/2', imagem: 'BBBB', imagemLgenda: 'Segunda' },
      ]),
    );
    service.listarComentarios.mockReturnValue(of([]));
    await component.carregar();
    const foto = component.fotos()[1];
    foto.textoComentario = '  Gostei desta foto!  ';
    const comentario = {
      mediaId: 'media/2',
      coment: 'Gostei desta foto!',
      dataCriacao: '2026-10-27',
    };
    service.comentar.mockReturnValue(of(''));
    service.listarComentarios.mockReturnValue(of([comentario]));
    await component.comentarFoto(foto);
    expect(service.comentar).toHaveBeenCalledWith('media/2', 'Gostei desta foto!');
    expect(foto.comentarios).toEqual([comentario]);
    expect(foto.textoComentario).toBe('');
    expect(foto.avisoComentario).toContain('publicado');
    expect(component.fotos()[0].comentarios).toEqual([]);
  });
  it('mostra a legenda em linha separada antes dos comentários e permite comentar pelo formulário', async () => {
    service.listarFotos.mockReturnValue(
      of([{ mediaId: 'foto-real', imagem: 'AAAA', imagemLgenda: 'teste' }]),
    );
    service.listarComentarios.mockReturnValue(of([]));
    service.comentar.mockReturnValue(of(''));
    const fixture = TestBed.createComponent(Candidatos);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.carregando()).toBe(false));
    fixture.detectChanges();
    const discussao = fixture.nativeElement.querySelector('.photo-discussion') as HTMLElement;
    const titulo = discussao.querySelector('h3')!;
    const legenda = discussao.querySelector('.caption')!;
    expect(titulo.textContent).toBe('Comentários');
    expect(legenda.previousElementSibling?.textContent).toBe('Legenda da foto:');
    expect(legenda.textContent?.trim()).toBe('teste');
    expect(legenda.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(discussao.textContent).not.toContain('Os comentários estão indisponíveis');
    const campo = discussao.querySelector('textarea')!;
    expect(campo.disabled).toBe(false);
    campo.value = 'Meu comentário';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    const publicar = discussao.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(publicar.disabled).toBe(false);
    publicar.click();
    await vi.waitFor(() =>
      expect(service.comentar).toHaveBeenCalledWith('foto-real', 'Meu comentário'),
    );
    await vi.waitFor(() => expect(fixture.componentInstance.enviandoComentario()).toBe(false));
    expect(fixture.componentInstance.fotos()[0].textoComentario).toBe('');
  });
  it('não publica comentário sem ID real da foto nem com texto vazio', async () => {
    await component.carregar();
    const foto = component.fotos()[0];
    foto.textoComentario = 'Gostei';
    await component.comentarFoto(foto);
    foto.mediaId = 'media/1';
    foto.textoComentario = '   ';
    await component.comentarFoto(foto);
    foto.textoComentario = 'a'.repeat(1001);
    await component.comentarFoto(foto);
    expect(service.comentar).not.toHaveBeenCalled();
  });
  it('preserva o comentário para nova tentativa quando a API falha', async () => {
    await component.carregar();
    const foto = component.fotos()[0];
    foto.mediaId = 'media/1';
    foto.textoComentario = 'Minha mensagem';
    service.comentar.mockReturnValue(throwError(() => new Error('Falha ao comentar')));
    await component.comentarFoto(foto);
    expect(foto.textoComentario).toBe('Minha mensagem');
    expect(foto.erroEnvioComentario).toBe('Falha ao comentar');
    expect(component.enviandoComentario()).toBe(false);
  });
  it('envia foto e legenda com o ID do candidato aberto e recarrega suas fotos', async () => {
    await component.carregar();
    const arquivo = new File(['foto'], 'foto.png', { type: 'image/png' });
    component.arquivoFoto.set(arquivo);
    component.legendaFoto = '  Meu olhar  ';
    service.enviarFoto.mockReturnValue(of(''));
    service.listarFotos.mockReturnValue(of([{ imagem: 'NOVA', imagemLgenda: 'Meu olhar' }]));
    await component.adicionarFoto();
    expect(service.enviarFoto).toHaveBeenCalledWith('1', 'Meu olhar', arquivo);
    expect(component.fotos()[0].imagem).toBe('NOVA');
    expect(component.arquivoFoto()).toBeNull();
    expect(component.legendaFoto).toBe('');
    expect(component.aviso()).toContain('Pessoa');
    await component.adicionarFoto();
    expect(service.enviarFoto).toHaveBeenCalledTimes(1);
  });
  it('mantém a foto e a legenda para tentar novamente quando o envio falha', async () => {
    await component.carregar();
    const arquivo = new File(['foto'], 'foto.png', { type: 'image/png' });
    component.arquivoFoto.set(arquivo);
    component.legendaFoto = 'Minha foto';
    service.enviarFoto.mockReturnValue(throwError(() => new Error('Falha no envio')));
    await component.adicionarFoto();
    expect(component.erroFoto()).toBe('Falha no envio');
    expect(component.arquivoFoto()).toBe(arquivo);
    expect(component.legendaFoto).toBe('Minha foto');
    expect(component.enviandoFoto()).toBe(false);
  });
  it('exibe os dados faltantes ao clicar e envia pelo formulário após preencher a legenda', async () => {
    const fixture = TestBed.createComponent(Candidatos);
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.componentInstance.carregando()).toBe(false));
    fixture.detectChanges();
    const tela = fixture.componentInstance;
    const enviar = fixture.nativeElement.querySelector(
      '.candidate-upload button[type="submit"]',
    ) as HTMLButtonElement;
    expect(enviar.disabled).toBe(false);
    enviar.click();
    await fixture.whenStable();
    expect(tela.erroFoto()).toContain('Selecione uma foto');
    const arquivo = new File(['foto'], 'foto.png', { type: 'image/png' });
    tela.arquivoFoto.set(arquivo);
    fixture.detectChanges();
    enviar.click();
    await fixture.whenStable();
    expect(tela.erroFoto()).toContain('legenda');
    expect(service.enviarFoto).not.toHaveBeenCalled();
    const legenda = fixture.nativeElement.querySelector('#legenda-foto') as HTMLTextAreaElement;
    legenda.value = 'Minha legenda';
    legenda.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    service.enviarFoto.mockReturnValueOnce(throwError(() => new Error('Falha no envio')));
    enviar.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(service.enviarFoto).toHaveBeenCalledWith('1', 'Minha legenda', arquivo);
    expect(enviar.textContent).toContain('Tentar enviar novamente');
    expect(tela.arquivoFoto()).toBe(arquivo);
    expect(tela.legendaFoto).toBe('Minha legenda');
    service.enviarFoto.mockReturnValue(of(''));
    enviar.click();
    await fixture.whenStable();
    await vi.waitFor(() => expect(tela.enviandoFoto()).toBe(false));
    fixture.detectChanges();
    expect(service.enviarFoto).toHaveBeenCalledTimes(2);
    expect(tela.erroFoto()).toBe('');
    expect(tela.aviso()).toContain('Foto adicionada');
  });
  it('não envia sem sessão, foto ou legenda válida', async () => {
    await component.carregar();
    await component.adicionarFoto();
    component.arquivoFoto.set(new File(['foto'], 'foto.png', { type: 'image/png' }));
    component.legendaFoto = '   ';
    await component.adicionarFoto();
    component.legendaFoto = 'a'.repeat(501);
    await component.adicionarFoto();
    component.legendaFoto = 'Legenda';
    service.estaAutenticado.mockReturnValue(false);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await component.adicionarFoto();
    expect(service.enviarFoto).not.toHaveBeenCalled();
  });
  it('bloqueia envio duplicado enquanto a requisição está em andamento', async () => {
    await component.carregar();
    component.arquivoFoto.set(new File(['foto'], 'foto.png', { type: 'image/png' }));
    component.legendaFoto = 'Legenda';
    const resposta = new Subject<string>();
    service.enviarFoto.mockReturnValue(resposta);
    const envio = component.adicionarFoto();
    await component.adicionarFoto();
    expect(service.enviarFoto).toHaveBeenCalledTimes(1);
    resposta.next('');
    resposta.complete();
    await envio;
  });
  it('rejeita formato incorreto e arquivo acima de 10 MB antes do envio', async () => {
    const selecionar = (arquivo: File) =>
      component.selecionarFoto({
        target: { files: [arquivo], value: 'selecionado' },
      } as unknown as Event);
    await selecionar(new File(['foto'], 'foto.jpg', { type: 'image/jpeg' }));
    expect(component.erroFoto()).toContain('PNG');
    const grande = new File(['foto'], 'foto.png', { type: 'image/png' });
    Object.defineProperty(grande, 'size', { value: 10 * 1024 * 1024 + 1 });
    await selecionar(grande);
    expect(component.erroFoto()).toContain('10 MB');
    expect(component.arquivoFoto()).toBeNull();
    expect(service.enviarFoto).not.toHaveBeenCalled();
  });
  it('aceita somente as dimensões 1080 × 1080 e libera a prévia ao sair', async () => {
    let largura = 800;
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = largura;
        naturalHeight = 1080;
        onload?: () => void;
        set src(_: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:previa'),
      revokeObjectURL: vi.fn(),
    });
    try {
      const arquivo = new File(['foto'], 'foto.png', { type: 'image/png' });
      const evento = { target: { files: [arquivo], value: '' } } as unknown as Event;
      await component.selecionarFoto(evento);
      expect(component.erroFoto()).toContain('1080 × 1080');
      expect(component.arquivoFoto()).toBeNull();
      largura = 1080;
      await component.selecionarFoto(evento);
      expect(component.arquivoFoto()).toBe(arquivo);
      expect(component.previaFoto()).toBe('blob:previa');
      component.ngOnDestroy();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:previa');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('permite escolher outra foto após erro de dimensão sem recarregar nem perder a legenda', async () => {
    let largura = 800;
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = largura;
        naturalHeight = 1080;
        onload?: () => void;
        set src(_: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:tentativa'),
      revokeObjectURL: vi.fn(),
    });
    const fixture = TestBed.createComponent(Candidatos);
    try {
      const tela = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      tela.legendaFoto = 'Manter minha legenda';
      fixture.detectChanges();
      const campo = fixture.nativeElement.querySelector('#foto-candidato') as HTMLInputElement;
      const escolher = async (arquivo: File) => {
        Object.defineProperty(campo, 'files', { configurable: true, value: [arquivo] });
        campo.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));
        await fixture.whenStable();
        fixture.detectChanges();
      };
      await escolher(new File(['foto inválida'], 'foto.png', { type: 'image/png' }));
      expect(tela.erroFoto()).toContain('1080 × 1080');
      expect(tela.validandoFoto()).toBe(false);
      expect(campo.disabled).toBe(false);
      const tentar = fixture.nativeElement.querySelector('.retry-photo') as HTMLButtonElement;
      expect(tentar.type).toBe('button');
      expect(tentar.disabled).toBe(false);
      const abrirSeletor = vi.spyOn(campo, 'click').mockImplementation(() => {});
      tentar.click();
      fixture.detectChanges();
      expect(abrirSeletor).toHaveBeenCalledOnce();
      expect(tela.erroFoto()).toBe('');
      expect(tela.legendaFoto).toBe('Manter minha legenda');
      largura = 1080;
      const novaFoto = new File(['foto corrigida'], 'foto.png', { type: 'image/png' });
      await escolher(novaFoto);
      expect(tela.arquivoFoto()).toBe(novaFoto);
      expect(tela.previaFoto()).toBe('blob:tentativa');
      expect(
        fixture.nativeElement.querySelector('.candidate-upload button[type="submit"]').disabled,
      ).toBe(false);
      expect(service.enviarFoto).not.toHaveBeenCalled();
    } finally {
      fixture.destroy();
      vi.unstubAllGlobals();
    }
  });
});
