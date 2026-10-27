import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Galeria } from './galeria';
import { Services, FotoGaleria } from '../../services/services/services';

describe('Galeria pública', () => {
  const foto: FotoGaleria = {
    chave: '1:0',
    autor: 'Autor',
    imagem: 'AAAA',
    imagemLgenda: 'Um novo olhar',
  };
  let component: Galeria;
  let fixture: ComponentFixture<Galeria>;
  const service = { carregarGaleria: vi.fn(), listarComentarios: vi.fn(), comentar: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks();
    service.carregarGaleria.mockReturnValue(of([foto]));
    TestBed.configureTestingModule({
      imports: [Galeria],
      providers: [provideRouter([]), { provide: Services, useValue: service }],
    });
    fixture = TestBed.createComponent(Galeria);
    component = fixture.componentInstance;
  });
  it('busca por autor e legenda', async () => {
    await component.carregar();
    component.busca = 'novo olhar';
    expect(component.fotosFiltradas()).toHaveLength(1);
    component.busca = 'AUTOR';
    expect(component.fotosFiltradas()).toHaveLength(1);
    component.busca = 'inexistente';
    expect(component.fotosFiltradas()).toHaveLength(0);
  });
  it('não envia comentários sem o identificador real da mídia', async () => {
    await component.abrir(foto);
    component.textoComentario = 'Gostei';
    await component.comentar();
    expect(service.comentar).not.toHaveBeenCalled();
    expect(service.listarComentarios).not.toHaveBeenCalled();
  });
  it('envia comentário apenas para a mídia selecionada', async () => {
    service.listarComentarios.mockReturnValue(of([]));
    service.comentar.mockReturnValue(of(''));
    await component.abrir({ ...foto, mediaId: 'media/1' });
    component.textoComentario = '  Gostei!  ';
    await component.comentar();
    expect(service.comentar).toHaveBeenCalledWith('media/1', 'Gostei!');
    expect(component.textoComentario).toBe('');
  });
  it('mostra falha de carregamento e permite nova tentativa', async () => {
    service.carregarGaleria.mockReturnValueOnce(throwError(() => new Error('Falha de conexão')));
    await component.carregar();
    expect(component.erro()).toContain('Falha');
    expect(component.carregando()).toBe(false);
    await component.carregar();
    expect(component.erro()).toBe('');
    expect(component.fotos()).toHaveLength(1);
  });
  it('atualiza a foto aberta a cada cinco segundos sem apagar o rascunho e para ao fechar ou sair', async () => {
    vi.useFakeTimers();
    try {
      service.listarComentarios.mockReturnValue(of([]));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      await component.abrir({ ...foto, mediaId: 'media/1' });
      component.textoComentario = 'Estou escrevendo';
      const novo = {
        mediaId: 'media/1',
        coment: 'Comentário de outra pessoa',
        dataCriacao: '2026-10-27',
      };
      service.listarComentarios.mockReturnValue(of([novo]));
      await vi.advanceTimersByTimeAsync(5000);
      expect(component.comentarios()).toEqual([novo]);
      expect(component.textoComentario).toBe('Estou escrevendo');
      expect(service.listarComentarios).toHaveBeenCalledTimes(2);
      component.fechar();
      await vi.advanceTimersByTimeAsync(5000);
      expect(service.listarComentarios).toHaveBeenCalledTimes(2);
      await component.abrir({ ...foto, mediaId: 'media/1' });
      component.ngOnDestroy();
      const chamadas = service.listarComentarios.mock.calls.length;
      await vi.advanceTimersByTimeAsync(5000);
      expect(service.listarComentarios).toHaveBeenCalledTimes(chamadas);
    } finally {
      component.ngOnDestroy();
      vi.useRealTimers();
    }
  });
  it('não deixa uma consulta antiga sobrescrever a lista atualizada após publicar', async () => {
    service.listarComentarios.mockReturnValue(of([]));
    service.comentar.mockReturnValue(of(''));
    await component.abrir({ ...foto, mediaId: 'media/1' });
    const antiga = new Subject<[]>();
    service.listarComentarios.mockReturnValueOnce(antiga);
    const atualizacao = component.atualizarComentarios();
    const novo = { mediaId: 'media/1', coment: 'Meu comentário', dataCriacao: '2026-10-27' };
    service.listarComentarios.mockReturnValue(of([novo]));
    component.textoComentario = 'Meu comentário';
    await component.comentar();
    antiga.next([]);
    antiga.complete();
    await atualizacao;
    expect(component.comentarios()).toEqual([novo]);
    expect(component.enviandoComentario()).toBe(false);
  });
});
