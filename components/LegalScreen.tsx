"use client";

import Link from "next/link";
import { brand } from "@/lib/brand";
import { useProduct } from "@/lib/product";
import { Subpage } from "./product-ui";

export type LegalKind =
  | "termos"
  | "privacidade"
  | "cookies"
  | "reembolso"
  | "riscos"
  | "empresa";

const links = [
  ["/termos", "Termos"],
  ["/privacidade", "Privacidade"],
  ["/cookies", "Cookies"],
  ["/reembolso", "Reembolso"],
  ["/riscos", "Riscos"],
  ["/empresa", "Empresa"],
] as const;

function LegalNav({ current }: { current: string }) {
  return (
    <nav aria-label="Documentos legais" className="mb-5 flex flex-wrap gap-2">
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            href === current ? "gold-fill text-[#120e05]" : "bg-panel text-sand ring-1 ring-[#d4af37]/25"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function LegalScreen({ kind }: { kind: LegalKind }) {
  const product = useProduct();
  const company = brand.company;

  if (kind === "termos") {
    return (
      <Subpage title="Termos de serviço" lede={`Regras de uso do ${brand.name}. Leitura obrigatória antes de criar conta.`}>
        <LegalNav current="/termos" />
        <article className="space-y-3 text-sm leading-relaxed text-sand">
          <p>O {brand.name} é destinado exclusivamente a pessoas com 18 anos ou mais. Ao criar conta, você declara essa condição e autoriza checagens de idade quando solicitadas.</p>
          <p>Você é responsável pelo conteúdo que publica (fotos, vídeos, textos e reels). É proibido assédio, discurso de ódio, conteúdo sexual envolvendo menores, impersonação, spam e fraude.</p>
          <p>O Match e o feed mostram apenas perfis e vídeos reais publicados por pessoas com conta. Avaliações e depoimentos exibidos devem ser reais; não usamos avaliações fabricadas.</p>
          <p>Recursos pagos (planos, boosts, itens) só são cobrados quando o fluxo de pagamento regulado estiver ativo. Até lá, compras no app não geram cobrança.</p>
          <p>Sorteios e prêmios só ocorrem com autorização legal competente. Não há promessa de ganhos, encontros ou resultados afetivos.</p>
          <p>Podemos suspender contas que violem estes termos, após denúncia ou moderação. O uso contínuo implica aceite destes termos e da política de privacidade.</p>
          <p>
            Contato: {company.supportEmail} · {company.legalName} · CNPJ {company.cnpj}
          </p>
        </article>
      </Subpage>
    );
  }

  if (kind === "privacidade") {
    return (
      <Subpage title="Política de privacidade" lede="Tratamento de dados pessoais conforme a LGPD (Lei 13.709/2018).">
        <LegalNav current="/privacidade" />
        <article className="space-y-3 text-sm leading-relaxed text-sand">
          <p>
            Controlador: {company.legalName} (“{company.tradeName}”), CNPJ {company.cnpj}, {company.address}. Encarregado (DPO): {company.dpoEmail}.
          </p>
          <p>
            Coletamos apenas o necessário para o serviço: e-mail, senha (hash via Supabase Auth), nome, idade, gênero, cidade, bio, interesses, fotos/vídeos que você envia, preferências de busca e registros de curtidas/matches/mensagens.
          </p>
          <p>Bases legais principais: execução de contrato (prestação do app), consentimento (marketing/cookies não essenciais e envio de mídia) e legítimo interesse (segurança, prevenção a fraude e melhoria do produto).</p>
          <p>Não vendemos dados pessoais. Compartilhamos com provedores essenciais (hospedagem EasyPanel e autenticação/armazenamento Supabase) sob contratos e medidas de segurança.</p>
          <p>Você pode acessar, corrigir, portar ou excluir dados pela tela Perfil / exportação, ou pedindo a {company.dpoEmail}. Também pode revogar consentimentos de cookies no aviso de cookies.</p>
          <p>Imagens de verificação, quando enviadas, são usadas só para análise do pedido e não geram banco biométrico permanente nesta versão.</p>
        </article>
        <div className="mt-5 grid gap-2">
          <button className="rounded-2xl gold-fill py-3 font-bold" onClick={() => product.exportData()}>
            Baixar meus dados
          </button>
          <button className="rounded-2xl bg-panel py-3 font-semibold" onClick={() => product.acceptTerms()}>
            {product.state.termsAt ? "Aceite registrado neste aparelho" : "Registrar aceite dos termos"}
          </button>
        </div>
      </Subpage>
    );
  }

  if (kind === "cookies") {
    return (
      <Subpage title="Aviso de cookies" lede="Explicamos quais cookies e tecnologias semelhantes usamos.">
        <LegalNav current="/cookies" />
        <article className="space-y-3 text-sm leading-relaxed text-sand">
          <p>
            <strong className="text-white">Essenciais:</strong> sessão de autenticação, preferências de segurança e funcionamento do app. Sem eles o login e a navegação básica não funcionam.
          </p>
          <p>
            <strong className="text-white">Preferências:</strong> lembram escolha de cookies, cidade/filtros locais e ajustes de interface no seu aparelho.
          </p>
          <p>
            <strong className="text-white">Métricas (opcional):</strong> só ativamos scripts de medição agregada se você consentir no banner. Não carregamos trackers de terceiros sem aceite.
          </p>
          <p>
            Você pode alterar a escolha a qualquer momento limpando o armazenamento do site ou pedindo suporte em {company.supportEmail}.
          </p>
        </article>
        <button
          className="mt-5 w-full rounded-2xl gold-fill py-3 font-bold"
          onClick={() => {
            try {
              localStorage.removeItem("valentines-cookies");
            } catch {
              /* ignore */
            }
            window.location.reload();
          }}
        >
          Revisar escolha de cookies
        </button>
      </Subpage>
    );
  }

  if (kind === "reembolso") {
    return (
      <Subpage title="Política de reembolso" lede="Regras para cobranças quando o pagamento real estiver ativo.">
        <LegalNav current="/reembolso" />
        <article className="space-y-3 text-sm leading-relaxed text-sand">
          <p>Enquanto o pagamento regulado não estiver ativo, não há cobrança e portanto não há reembolso a processar.</p>
          <p>Quando um parceiro de pagamento regulado estiver integrado: assinaturas recorrentes podem ser canceladas a qualquer momento, com efeito no próximo ciclo; itens consumíveis (boosts etc.) só são reembolsáveis em caso de falha técnica comprovada ou cobrança indevida.</p>
          <p>Pedidos de reembolso: {company.supportEmail}, com e-mail da conta, data e comprovante. Análise em até 7 dias úteis.</p>
          <p>Direitos do Código de Defesa do Consumidor (CDC) permanecem aplicáveis às compras reais.</p>
        </article>
      </Subpage>
    );
  }

  if (kind === "riscos") {
    return (
      <Subpage title="Riscos jurídicos e de uso" lede="Avisos importantes sobre encontros, conteúdo e responsabilidade.">
        <LegalNav current="/riscos" />
        <article className="space-y-3 text-sm leading-relaxed text-sand">
          <p>O {brand.name} facilita conexões online. Não garantimos compatibilidade, encontros presenciais, relacionamentos ou resultados emocionais.</p>
          <p>Encontros presenciais são de sua exclusiva responsabilidade. Recomendamos cautela: locais públicos, avisar alguém de confiança e denunciar comportamentos abusivos no app.</p>
          <p>Conteúdo gerado por usuários pode ser ofensivo; usamos denúncias e moderação, mas não conseguimos pré-aprovar tudo em tempo real.</p>
          <p>Uso indevido (fraude, menores, assédio) pode gerar responsabilização civil/criminal do usuário e exclusão da plataforma.</p>
          <p>Este material não substitui aconselhamento jurídico. Para dúvidas: {company.supportEmail}.</p>
        </article>
      </Subpage>
    );
  }

  return (
    <Subpage title="Dados da empresa" lede="Identificação do responsável pelo serviço.">
      <LegalNav current="/empresa" />
      <article className="space-y-3 text-sm leading-relaxed text-sand">
        <p>
          <strong className="text-white">Razão social:</strong> {company.legalName}
        </p>
        <p>
          <strong className="text-white">Nome fantasia:</strong> {company.tradeName}
        </p>
        <p>
          <strong className="text-white">CNPJ:</strong> {company.cnpj}
        </p>
        <p>
          <strong className="text-white">Endereço:</strong> {company.address}
        </p>
        <p>
          <strong className="text-white">Suporte:</strong> {company.supportEmail}
        </p>
        <p>
          <strong className="text-white">Privacidade / DPO:</strong> {company.dpoEmail}
        </p>
        <p>
          Dados societários (CNPJ/endereço) devem permanecer atualizados no cadastro da empresa.
        </p>
      </article>
    </Subpage>
  );
}
