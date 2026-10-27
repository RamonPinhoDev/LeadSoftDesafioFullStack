import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Login } from './login';
import { Services } from '../../services/services/services';

describe('Login administrativo', () => {
  let component: Login;
  const service = {
    estaAutenticado: () => false,
    prepararRecaptcha: async () => {},
    entrar: vi.fn(),
  };
  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: Services, useValue: service }],
    });
    component = TestBed.createComponent(Login).componentInstance;
  });
  it('exige e-mail e senha antes de chamar o serviço', async () => {
    await component.entrar();
    expect(service.entrar).not.toHaveBeenCalled();
  });
  it('mantém o visitante fora do painel quando o login falha', async () => {
    service.entrar.mockRejectedValue(new Error('Acesso recusado'));
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    component.frm.setValue({ email: 'admin@example.com', senha: 'teste' });
    await component.entrar();
    expect(component.erro()).toBe('Acesso recusado');
    expect(navegar).not.toHaveBeenCalled();
    expect(component.carregando()).toBe(false);
  });
  it('limpa a senha e abre o painel após autenticação', async () => {
    service.entrar.mockResolvedValue(undefined);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    component.frm.setValue({ email: 'admin@example.com', senha: 'teste' });
    await component.entrar();
    expect(navegar).toHaveBeenCalledWith('/admin');
    expect(component.frm.controls.senha.value).toBe('');
  });
});
