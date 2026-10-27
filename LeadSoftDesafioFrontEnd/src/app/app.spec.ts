import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { Services } from './services/services/services';
import { acessoAutenticado, routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(Services).sair();
  });
  afterEach(() => {
    TestBed.inject(Services).sair();
    vi.restoreAllMocks();
  });
  it('mostra somente o acesso ao login antes da autenticação', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const texto = fixture.nativeElement.textContent;
    expect(fixture.nativeElement.querySelector('a[href="/galeria"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/cadastro"]')).toBeNull();
    expect(texto).not.toContain('Área restrita');
    expect(fixture.nativeElement.querySelector('.brand')?.getAttribute('href')).toBe('/login');
  });
  it('mostra Cadastrar e as telas internas com o cookie de sessão', async () => {
    document.cookie = 'leadsoft_sessao=1; Path=/; SameSite=Strict';
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a[href="/cadastro"]')?.textContent).toBe(
      'Cadastrar',
    );
    expect(fixture.nativeElement.textContent).toContain('Sair');
  });
  it('define login como primeira página e protege galeria e painel', () => {
    expect(routes.find((r) => r.path === '')?.redirectTo).toBe('login');
    for (const caminho of ['galeria', 'admin', 'admin/candidato/:id']) {
      expect(routes.find((r) => r.path === caminho)?.canActivate).toContain(acessoAutenticado);
    }
    expect(routes.find((r) => r.path === 'cadastro')?.canActivate).toBeUndefined();
  });
  it('remove o cookie quando a página é encerrada', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    document.cookie = 'leadsoft_sessao=1; Path=/; SameSite=Strict';
    window.dispatchEvent(new Event('pagehide'));
    expect(TestBed.inject(Services).estaAutenticado()).toBe(false);
  });
  it('redireciona visitantes para o login nas rotas administrativas', () => {
    const resultado = TestBed.runInInjectionContext(() =>
      acessoAutenticado({} as never, {} as never),
    );
    expect(TestBed.inject(Router).serializeUrl(resultado as never)).toBe('/login');
  });
  it('aceita a rota administrativa somente com sessão ativa', () => {
    vi.spyOn(TestBed.inject(Services), 'estaAutenticado').mockReturnValue(true);
    expect(TestBed.runInInjectionContext(() => acessoAutenticado({} as never, {} as never))).toBe(
      true,
    );
  });
});
