"use client";

import { brand } from "@/lib/brand";
import { useProduct } from "@/lib/product";
import { Subpage } from "./product-ui";

export function LegalScreen({ kind }: { kind: "termos" | "privacidade" }) {
  const product = useProduct();
  if (kind === "termos") {
    return (
      <Subpage title="Termos de uso" lede={`Estes termos valem para o ${brand.name}. Eles são a base do produto e precisam de revisão jurídica antes do lançamento.`}>
        <article className="space-y-3 text-sm leading-relaxed text-sand">
          <p>O app é para maiores de 18 anos. A idade é checada no cadastro com captcha, código e, quando você envia, um pedido de análise. Declarar a idade sozinho não basta.</p>
          <p>Os perfis de exemplo são fictícios. O que você escreve fica neste aparelho até você apagar.</p>
          <p>É proibido assediar, publicar conteúdo de menor, fingir ser outra pessoa ou usar o convite para criar contas repetidas.</p>
          <p>Planos e itens avulsos desta versão são uma simulação. Nada é cobrado. Um PIX real só entra com um parceiro regulado.</p>
          <p>O sorteio de moto não está ativo. Ele só pode existir com autorização do Ministério da Fazenda.</p>
          <p>Podemos ocultar um perfil denunciado na sua conta e encerrar o caso na fila de moderação.</p>
        </article>
      </Subpage>
    );
  }
  return (
    <Subpage title="Privacidade" lede="Aviso de privacidade no estilo da LGPD, com um bloco para quem estiver na Europa. Revisão jurídica ainda é necessária.">
      <article className="space-y-3 text-sm leading-relaxed text-sand">
        <p>Dados da conta: nome, idade, cidade, bio, interesses, foto que você escolhe, telefone informado e o status de verificação. Ficam no navegador, na chave local deste aparelho.</p>
        <p>A imagem de documento ou de rosto, quando você envia na verificação, é lida para abrir o pedido e em seguida descartada. Não guardamos a imagem nem um modelo biométrico.</p>
        <p>Não vendemos esses dados. O uso é criar o perfil, mostrar matches, medir ativação neste aparelho e operar convites e a loja simulada.</p>
        <p>Você pode baixar um arquivo com os dados locais e pode apagar a conta na tela Eu. Também pode pedir isso pelo suporte.</p>
        <p>Para a Europa: a base é o seu consentimento e a execução do serviço que você pediu. Os direitos de acesso, correção, exclusão e portabilidade estão nos botões abaixo. Não há transferência para outro país nesta versão, porque não há servidor.</p>
      </article>
      <div className="mt-5 grid gap-2">
        <button className="rounded-2xl gold-fill py-3 font-bold" onClick={() => product.exportData()}>
          Baixar meus dados
        </button>
        <button className="rounded-2xl bg-panel py-3 font-semibold" onClick={() => product.acceptTerms()}>
          {product.state.termsAt ? "Termos aceitos neste aparelho" : "Registrar aceite dos termos"}
        </button>
      </div>
    </Subpage>
  );
}
