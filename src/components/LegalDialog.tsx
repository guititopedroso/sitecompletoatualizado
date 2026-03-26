import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LegalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "terms" | "privacy";
}

const TermsContent = () => (
  <div className="space-y-6 text-sm">
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">1. Objeto</h3>
      <p className="text-muted-foreground leading-relaxed">
        Os presentes Termos e Condições regulam a utilização dos serviços de aluguer de motas de água (jet skis) prestados pela ValeJet, com operações na área de jurisdição da Capitania do Porto de Setúbal, abrangendo as zonas de Setúbal e Tróia, em conformidade com o Edital n.º 97/2022.
      </p>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">2. Enquadramento Legal</h3>
      <p className="text-muted-foreground leading-relaxed">
        A navegação e permanência no espaço de jurisdição da Capitania do Porto de Setúbal rege-se pelo Edital n.º 97/2022, sem prejuízo da legislação aplicável, nomeadamente:
      </p>
      <ul className="text-muted-foreground space-y-1 list-disc pl-6 mt-2">
        <li>Decreto-Lei n.º 44/2002 (Sistema da Autoridade Marítima)</li>
        <li>Decreto-Lei n.º 93/2018 (Regime Jurídico da Náutica de Recreio)</li>
        <li>Regulamento Internacional para Evitar Abalroamentos no Mar (RIEAM)</li>
        <li>Plano de Ordenamento do Parque Natural da Arrábida (POPNA)</li>
        <li>Regulamento da Reserva Natural do Estuário do Sado (RNES)</li>
      </ul>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">3. Área de Navegação e Restrições</h3>
      <p className="text-muted-foreground leading-relaxed">
        É proibida a circulação de motas de água nas seguintes áreas: Canal sul do estuário do Sado, Triângulo Ponta do Adoxe – Boia Cardeal João Farto – Baliza 5, e Parque Marinho Luiz Saldanha.
      </p>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">4. Requisitos do Utilizador</h3>
      <ul className="text-muted-foreground space-y-1 list-disc pl-6">
        <li>Idade mínima de 18 anos para condução.</li>
        <li>Uso obrigatório de colete salva-vidas.</li>
        <li>Documento de identificação válido.</li>
        <li>Proibida condução sob efeito de álcool ou substâncias psicotrópicas.</li>
      </ul>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">5. Segurança da Navegação</h3>
      <ul className="text-muted-foreground space-y-1 list-disc pl-6">
        <li>Respeitar o RIEAM.</li>
        <li>Manter distância de segurança de banhistas e outras embarcações.</li>
        <li>Em emergência: CLPM Setúbal (265 105 123) ou canal 16 VHF.</li>
      </ul>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">6. Proteção Ambiental</h3>
      <p className="text-muted-foreground leading-relaxed">
        Proibido lançar detritos nas águas. Respeitar a fauna marinha, em especial os golfinhos roazes-corvineiros do estuário do Sado.
      </p>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">7. Responsabilidade e Infrações</h3>
      <p className="text-muted-foreground leading-relaxed">
        As infrações são passíveis de constituir ilícito contraordenacional. O utilizador é responsável por danos causados ao equipamento por uso negligente.
      </p>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">8. Reservas e Cancelamentos</h3>
      <ul className="text-muted-foreground space-y-1 list-disc pl-6">
        <li>Reservas sujeitas a confirmação.</li>
        <li>Cancelamento por condições meteorológicas: reagendamento ou reembolso.</li>
        <li>Cancelamento pelo utilizador com menos de 24h pode não ser reembolsado.</li>
      </ul>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">9. Contactos da Autoridade Marítima</h3>
      <p className="text-muted-foreground leading-relaxed">
        Capitania do Porto de Setúbal: 265 548 270 · CLPM: 265 105 123 · Emergências: Canal 16 VHF
      </p>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">10. Disposições Finais</h3>
      <p className="text-muted-foreground leading-relaxed">
        Ao efetuar uma reserva, o utilizador declara ter lido e aceite os presentes Termos e Condições. Foro competente: comarca de Setúbal.
      </p>
    </section>
  </div>
);

const PrivacyContent = () => (
  <div className="space-y-6 text-sm">
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">1. Responsável pelo Tratamento</h3>
      <p className="text-muted-foreground leading-relaxed">
        A ValeJet, com sede em Setúbal, Portugal, é a entidade responsável pelo tratamento dos dados pessoais recolhidos.
      </p>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">2. Dados Pessoais Recolhidos</h3>
      <ul className="text-muted-foreground space-y-1 list-disc pl-6">
        <li>Dados de identificação: nome, documento de identificação.</li>
        <li>Dados de contacto: e-mail, telemóvel.</li>
        <li>Dados de reserva: data, hora, experiência, participantes, local.</li>
        <li>Dados de navegação: IP, browser, cookies.</li>
      </ul>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">3. Finalidades do Tratamento</h3>
      <ul className="text-muted-foreground space-y-1 list-disc pl-6">
        <li>Gestão e confirmação de reservas.</li>
        <li>Comunicação com o utilizador.</li>
        <li>Cumprimento de obrigações legais marítimas.</li>
        <li>Segurança e seguros.</li>
      </ul>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">4. Base Legal</h3>
      <p className="text-muted-foreground leading-relaxed">
        Execução de contrato, cumprimento de obrigações legais, consentimento e interesse legítimo, conforme artigo 6.º do RGPD.
      </p>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">5. Partilha de Dados</h3>
      <p className="text-muted-foreground leading-relaxed">
        Dados podem ser partilhados com: Capitania do Porto, Polícia Marítima, companhias de seguros, prestadores de serviços e ICNF, quando necessário. Sem transferências para fora do EEE.
      </p>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">6. Prazo de Conservação</h3>
      <ul className="text-muted-foreground space-y-1 list-disc pl-6">
        <li>Dados de reserva: 5 anos.</li>
        <li>Dados de navegação: 12 meses.</li>
        <li>Dados de marketing: até retirada do consentimento.</li>
      </ul>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">7. Direitos do Titular</h3>
      <p className="text-muted-foreground leading-relaxed">
        Acesso, retificação, apagamento, limitação, portabilidade, oposição e retirada de consentimento. Reclamação junto da CNPD.
      </p>
    </section>
    <section>
      <h3 className="font-display text-lg font-700 text-foreground mb-2">8. Segurança</h3>
      <p className="text-muted-foreground leading-relaxed">
        A ValeJet adota medidas técnicas e organizativas adequadas conforme o artigo 32.º do RGPD.
      </p>
    </section>
  </div>
);

const LegalDialog = ({ open, onOpenChange, type }: LegalDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[80vh] p-0">
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="font-display text-xl font-800">
          {type === "terms" ? "Termos e Condições" : "Política de Privacidade"}
        </DialogTitle>
      </DialogHeader>
      <ScrollArea className="px-6 pb-6 max-h-[65vh]">
        {type === "terms" ? <TermsContent /> : <PrivacyContent />}
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

export default LegalDialog;
