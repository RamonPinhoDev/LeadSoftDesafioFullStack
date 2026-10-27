import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { throwError, of } from 'rxjs';
import { Cadastro } from './cadastro';
import { Services } from '../../services/services/services';

describe('Cadastro de usuários', () => {
  let component: Cadastro;
  let service: Services;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Cadastro],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    component = TestBed.createComponent(Cadastro).componentInstance;
    service = TestBed.inject(Services);
  });
  afterEach(() => vi.restoreAllMocks());
  function preencher(): void {
    component.frm.setValue({
      nome: 'Pessoa Teste',
      cpf: '529.982.247-25',
      email: 'TESTE@example.com',
      senha: 'MinhaSenha123',
      dataNascimento: '2000-01-01',
    });
  }
  it('não envia formulário incompleto', async () => {
    const cadastrar = vi.spyOn(service, 'cadastrarCandidato');
    await component.Salvar();
    expect(cadastrar).not.toHaveBeenCalled();
  });
  it('recusa CPF incorreto e nascimento futuro', () => {
    component.frm.patchValue({ cpf: '11111111111', dataNascimento: '2099-01-01' });
    expect(component.frm.controls.cpf.invalid).toBe(true);
    expect(component.frm.controls.dataNascimento.invalid).toBe(true);
  });
  it('cadastra apenas dados pessoais e senha, sem exigir imagem ou legenda', async () => {
    preencher();
    vi.spyOn(service, 'validarUnicidade').mockResolvedValue(undefined);
    const cadastrar = vi.spyOn(service, 'cadastrarCandidato').mockReturnValue(of(''));
    const upload = vi.spyOn(service, 'enviarFoto');
    const localizar = vi.spyOn(service, 'localizarCadastro');
    await component.Salvar();
    expect(cadastrar).toHaveBeenCalledWith({
      nome: 'Pessoa Teste',
      cpf: '52998224725',
      email: 'teste@example.com',
      senha: 'MinhaSenha123',
      dataNascimento: '2000-01-01T00:00:00',
    });
    expect(upload).not.toHaveBeenCalled();
    expect(localizar).not.toHaveBeenCalled();
    expect(component.sucesso()).toBe(true);
    expect(component.frm.controls.senha.value).toBe('');
    await component.Salvar();
    expect(cadastrar).toHaveBeenCalledTimes(1);
  });
  it('permite corrigir ou reenviar os dados se a API recusar o cadastro', async () => {
    preencher();
    vi.spyOn(service, 'validarUnicidade').mockResolvedValue(undefined);
    vi.spyOn(service, 'cadastrarCandidato').mockReturnValue(
      throwError(() => new Error('Falha no cadastro')),
    );
    await component.Salvar();
    expect(component.sucesso()).toBe(false);
    expect(component.erro()).toBe('Falha no cadastro');
    expect(component.frm.enabled).toBe(true);
    expect(component.enviando()).toBe(false);
  });
});
