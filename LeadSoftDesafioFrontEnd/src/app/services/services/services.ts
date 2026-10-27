import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

import { Injectable } from '@angular/core';
import { firstValueFrom, forkJoin, map, of, switchMap, timeout } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export interface Candidato {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  dataNascimento: string;
}

export interface Foto {
  imagem: string;
  imagemLgenda: string;
  imagemId?: string;
  mediaId?: string;
}

export interface FotoGaleria extends Foto {
  autor: string;
  chave: string;
}

export interface Comentario {
  mediaId: string;
  coment: string;
  dataCriacao: string;
  comentarioId?: string;
}

interface Recaptcha {
  ready(callback: () => void): void;
  execute(key: string, options: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Recaptcha;
  }
}

export function cpfValido(valor: string): boolean {
  const cpf = valor.replace(/\D/g, '');
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(cpf[tamanho])) return false;
  }
  return true;
}

export function mensagemErro(erro: unknown): string {
  if (erro instanceof HttpErrorResponse) {
    let detalhes = erro.error;
    if (typeof detalhes === 'string') {
      try {
        detalhes = JSON.parse(detalhes);
      } catch {
        detalhes = null;
      }
    }
    if (erro.status === 0)
      return 'Não foi possível conectar à API. Verifique se ela está em execução e tente novamente.';
    if (erro.status === 401 || erro.status === 403)
      return 'Acesso não autorizado. Entre novamente.';
    // Não exibe stack traces, caminhos locais ou detalhes internos do servidor.
    if (erro.status >= 500)
      return 'O servidor não conseguiu concluir a solicitação. Tente novamente mais tarde.';
    if (detalhes?.title === 'Erro inesperado')
      return 'A API não conseguiu acessar os dados. Verifique a disponibilidade do serviço e tente novamente.';
    if (detalhes?.title === 'Erro ao acessar arquivo')
      return 'A API não conseguiu acessar o armazenamento de fotos. Tente novamente quando o serviço estiver disponível.';
    if (detalhes?.title === 'Formato de arquivo inválido')
      return 'A API recusou o formato da foto. Selecione uma imagem PNG válida.';
    return 'A API recusou a solicitação. Verifique os dados e tente novamente.';
  }
  if (erro instanceof Error && erro.name === 'TimeoutError')
    return 'O servidor demorou para responder. Tente novamente.';
  return erro instanceof Error ? erro.message : 'Não foi possível concluir a solicitação.';
}

@Injectable({ providedIn: 'root' })
export class Services {
  private readonly http = inject(HttpClient);
  private readonly leadUrl = '/api';
  readonly adminEmail = 'LeadIA@leadsoft.inf.br';
  readonly recaptchaSiteKey = '6Ld1dwIuAAAAAElsO1QHd6hvbmWh5pLM-MP2cA9J';
  private readonly cookieSessao = 'leadsoft_sessao';
  private recaptchaCarregando?: Promise<void>;
  private readonly nomesUpload = new WeakMap<File, string>();

  // Cookie de sessão: sem Expires/Max-Age, sem credenciais ou dados pessoais.
  // A API atual não emite token de autorização.
  estaAutenticado(): boolean {
    return document.cookie.split(';').some((cookie) => cookie.trim() === `${this.cookieSessao}=1`);
  }
  sair(): void {
    document.cookie = `${this.cookieSessao}=; Path=/; Max-Age=0; SameSite=Strict${location.protocol === 'https:' ? '; Secure' : ''}`;
  }

  private iniciarSessao(): void {
    document.cookie = `${this.cookieSessao}=1; Path=/; SameSite=Strict${location.protocol === 'https:' ? '; Secure' : ''}`;
    if (!this.estaAutenticado())
      throw new Error('Permita cookies neste site para concluir o login.');
  }

  listarCandidatos() {
    return this.http.get<Candidato[]>(`${this.leadUrl}/Usuarios/Get`).pipe(timeout(20000));
  }

  buscarCandidato(id: string) {
    return this.http
      .get<Candidato>(`${this.leadUrl}/Usuarios/Get/${encodeURIComponent(id)}`)
      .pipe(timeout(20000));
  }

  listarFotos(id: string) {
    return this.http
      .get<Foto[]>(`${this.leadUrl}/Arquivo/BuscarArquivoService/${encodeURIComponent(id)}`)
      .pipe(
        timeout(20000),
        map((fotos) =>
          fotos.map((foto) => ({
            ...foto,
            mediaId: foto.mediaId || foto.imagemId,
          })),
        ),
      );
  }

  carregarGaleria() {
    return this.listarCandidatos().pipe(
      switchMap((candidatos) =>
        candidatos.length
          ? forkJoin(
              candidatos.map((c) =>
                this.listarFotos(c.id).pipe(
                  map((fotos) =>
                    fotos.map(
                      (foto, i) =>
                        ({
                          ...foto,
                          autor: c.nome,
                          chave: `${c.id}:${foto.mediaId ?? i}`,
                        }) as FotoGaleria,
                    ),
                  ),
                ),
              ),
            ).pipe(map((grupos) => grupos.flat()))
          : of([] as FotoGaleria[]),
      ),
    );
  }

  async validarUnicidade(cpf: string, email: string): Promise<void> {
    if (email.trim().toLowerCase() === this.adminEmail.toLowerCase())
      throw new Error('Este e-mail é reservado para a administração.');
    const candidatos = await firstValueFrom(this.listarCandidatos());
    if (candidatos.some((c) => c.email.trim().toLowerCase() === email.trim().toLowerCase())) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    // A listagem não contém CPF; consultamos o endpoint de detalhes existente.
    for (let inicio = 0; inicio < candidatos.length; inicio += 8) {
      const detalhes = await Promise.all(
        candidatos.slice(inicio, inicio + 8).map((c) => firstValueFrom(this.buscarCandidato(c.id))),
      );
      if (detalhes.some((c) => c.cpf?.replace(/\D/g, '') === cpf))
        throw new Error('Este CPF já está cadastrado.');
    }
  }

  cadastrarCandidato(candidato: Omit<Candidato, 'id'> & { senha: string }) {
    return this.http
      .post(`${this.leadUrl}/Usuarios/Post`, candidato, { responseType: 'text' })
      .pipe(timeout(20000));
  }

  async localizarCadastro(email: string): Promise<Candidato> {
    // POST não retorna ID, e o índice do RavenDB pode levar um instante para atualizar.
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const candidatos = await firstValueFrom(this.listarCandidatos());
      const candidato = candidatos.find(
        (c) => c.email.trim().toLowerCase() === email.trim().toLowerCase(),
      );
      if (candidato) return candidato;
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    throw new Error(
      'O cadastro foi enviado, mas ainda não apareceu na consulta. Clique em tentar novamente para localizar o cadastro e enviar a foto.',
    );
  }

  enviarFoto(id: string, legenda: string, imagem: File) {
    const dados = new FormData();
    // Nome único: a API procura a legenda pelo nome do anexo.
    const nome = this.nomesUpload.get(imagem) ?? `${crypto.randomUUID()}.png`;
    this.nomesUpload.set(imagem, nome);
    dados.append('Imagem', imagem, nome);
    return this.http
      .post(`${this.leadUrl}/Arquivo/AnexarArquivoService`, dados, {
        params: { IdUsuario: id, ImagemLgenda: legenda },
        responseType: 'text',
      })
      .pipe(timeout(30000));
  }

  excluirCandidato(id: string) {
    if (!this.estaAutenticado()) throw new Error('Sua sessão expirou. Entre novamente.');
    return this.http
      .delete(`${this.leadUrl}/Usuarios/Delete/${encodeURIComponent(id)}`, { responseType: 'text' })
      .pipe(timeout(20000));
  }

  listarComentarios(mediaId: string) {
    return this.http
      .get<Comentario[]>(`${this.leadUrl}/Comentario`, { params: { MediaId: mediaId } })
      .pipe(timeout(20000));
  }

  comentar(mediaId: string, coment: string) {
    return this.http
      .post(`${this.leadUrl}/Comentario`, { mediaId, coment }, { responseType: 'text' })
      .pipe(timeout(20000));
  }

  excluirComentario(id: string) {
    if (!this.estaAutenticado()) throw new Error('Sua sessão expirou. Entre novamente.');
    return this.http
      .delete(`${this.leadUrl}/Comentario/${encodeURIComponent(id)}`, { responseType: 'text' })
      .pipe(timeout(20000));
  }

  prepararRecaptcha(): Promise<void> {
    if (this.recaptchaCarregando) return this.recaptchaCarregando;
    this.recaptchaCarregando = new Promise<void>((resolve, reject) => {
      if (window.grecaptcha?.execute) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      const limite = setTimeout(() => {
        script.remove();
        reject(new Error('O reCAPTCHA não respondeu. Verifique sua conexão e tente novamente.'));
      }, 15000);
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.recaptchaSiteKey}&hl=pt-BR`;
      script.async = true;
      script.onload = () => {
        clearTimeout(limite);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(limite);
        script.remove();
        reject(new Error('Não foi possível carregar o reCAPTCHA. Verifique sua conexão.'));
      };
      document.head.appendChild(script);
    }).catch((erro) => {
      this.recaptchaCarregando = undefined;
      throw erro;
    });
    return this.recaptchaCarregando;
  }

  async entrar(email: string, senha: string): Promise<void> {
    this.sair();
    await this.prepararRecaptcha();
    const token = await new Promise<string>((resolve, reject) => {
      const limite = setTimeout(
        () => reject(new Error('O reCAPTCHA demorou para responder. Tente novamente.')),
        15000,
      );
      const captcha = window.grecaptcha;
      if (!captcha) {
        clearTimeout(limite);
        reject(new Error('reCAPTCHA indisponível.'));
        return;
      }
      captcha.ready(() => {
        captcha
          .execute(this.recaptchaSiteKey, { action: 'admin_login' })
          .then(resolve, () =>
            reject(new Error('Não foi possível validar o reCAPTCHA. Tente novamente.')),
          )
          .finally(() => clearTimeout(limite));
      });
    });
    if (!token) throw new Error('Não foi possível validar o reCAPTCHA.');
    const aprovado = await firstValueFrom(
      this.http
        .get<boolean>(`${this.leadUrl}/Usuarios/ReCaptchaPassed`, {
          params: { gRecaptchaResponse: token },
        })
        .pipe(timeout(20000)),
    );
    if (aprovado !== true) throw new Error('Verificação de segurança recusada. Tente novamente.');
    const resposta = await firstValueFrom(
      this.http
        .post(
          `${this.leadUrl}/Usuarios/Login`,
          {
            nome: 'Administrador',
            email: email.trim(),
            senha,
            cpf: null,
            dataNascimento: '2000-01-01T00:00:00',
          },
          { observe: 'response', responseType: 'text' },
        )
        .pipe(timeout(20000)),
    );
    if (resposta.status !== 200) throw new Error('A API não confirmou o login. Tente novamente.');
    this.iniciarSessao();
  }
}
