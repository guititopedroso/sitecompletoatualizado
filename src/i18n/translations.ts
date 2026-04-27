export type Language = "pt" | "en" | "de" | "es" | "fr" | "zh";

export const languageLabels: Record<Language, string> = {
  pt: "PT",
  en: "EN",
  de: "DE",
  es: "ES",
  fr: "FR",
  zh: "中文",
};

export const languageFlags: Record<Language, string> = {
  pt: "🇵🇹",
  en: "🇬🇧",
  de: "🇩🇪",
  es: "🇪🇸",
  fr: "🇫🇷",
  zh: "🇨🇳",
};

type TranslationKeys = {
  // Navbar
  nav_home: string;
  nav_about: string;
  nav_experiences: string;
  nav_safety: string;
  nav_gallery: string;
  nav_contacts: string;
  nav_affiliates: string;
  nav_book_now: string;

  // Hero
  hero_badge: string;
  hero_title_1: string;
  hero_title_2: string;
  hero_subtitle: string;
  hero_cta_book: string;
  hero_cta_experiences: string;

  // About
  about_tag: string;
  about_title_1: string;
  about_title_2: string;
  about_desc: string;
  about_f1_title: string;
  about_f1_desc: string;
  about_f2_title: string;
  about_f2_desc: string;
  about_f3_title: string;
  about_f3_desc: string;
  about_f4_title: string;
  about_f4_desc: string;

  // Weather
  weather_tag: string;
  weather_title: string;
  weather_desc: string;
  weather_s1_title: string;
  weather_s1_desc: string;
  weather_s2_title: string;
  weather_s2_desc: string;
  weather_s3_title: string;
  weather_s3_desc: string;
  weather_s4_title: string;
  weather_s4_desc: string;
  weather_source: string;
  weather_modal_temp: string;
  weather_modal_wind: string;
  weather_modal_precipitation: string;
  weather_modal_sea_state: string;
  weather_modal_sunrise: string;
  weather_modal_sunset: string;


  // Experiences
  exp_tag: string;
  exp_title: string;
  exp_desc: string;
  exp_tab_jetski: string;
  exp_tab_boats: string;
  exp_tab_boats_soon: string;
  exp_tab_extras: string;
  exp_most_popular: string;
  exp_book: string;
  exp_book_now: string;
  exp_view_details: string;
  exp_max_2: string;
  exp_photos_optional: string;
  exp_15min: string;
  exp_30min: string;
  exp_1hour: string;
  exp_group: string;
  exp_sunset: string;
  exp_photos: string;
  exp_towable: string;
  exp_inc_1jetski: string;
  exp_inc_lifejacket: string;
  exp_inc_briefing: string;
  exp_inc_insurance: string;
  exp_inc_4jetski: string;
  exp_inc_1hour: string;
  exp_inc_guide: string;
  exp_inc_sunset_1h: string;
  exp_inc_arrabida: string;
  exp_inc_photos: string;
  exp_inc_15photos: string;
  exp_inc_proediting: string;
  exp_inc_24h: string;
  exp_inc_highres: string;
  exp_inc_towable_ride: string;
  exp_inc_photos_included: string;

  // Boats
  boat_people: string;
  boat_half_day: string;
  boat_full_day: string;
  boat_inc_fuel: string;
  boat_inc_lifejacket: string;
  boat_inc_briefing: string;
  boat_inc_insurance: string;
  boat_range_all: string;
  boat_range_low: string;
  boat_range_mid: string;
  boat_range_high: string;

  // Safety
  safety_tag: string;
  safety_title: string;
  safety_desc: string;
  safety_s1_title: string;
  safety_s1_desc: string;
  safety_s2_title: string;
  safety_s2_desc: string;
  safety_s3_title: string;
  safety_s3_desc: string;
  safety_s4_title: string;
  safety_s4_desc: string;

  // Gallery
  gallery_tag: string;
  gallery_title: string;
  gallery_cta: string;
  gallery_title_full: string;
  gallery_desc_full: string;

  // Testimonials
  test_tag: string;
  test_title: string;
  test_r1_name: string;
  test_r1_text: string;
  test_r2_name: string;
  test_r2_text: string;
  test_r3_name: string;
  test_r3_text: string;

  // Contact
  contact_tag: string;
  contact_title: string;
  contact_desc: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_whatsapp_desc: string;
  contact_email: string;
  contact_instagram: string;
  contact_hours: string;
  contact_hours_1: string;
  contact_location: string;
  contact_loc_1: string;
  contact_loc_2: string;
  contact_form_name: string;
  contact_form_name_ph: string;
  contact_form_email: string;
  contact_form_message: string;
  contact_form_message_ph: string;
  contact_form_send: string;

  // FAQ
  faq_title: string;
  faq_desc: string;
  faq_q1: string;
  faq_a1: string;
  faq_q2: string;
  faq_a2: string;
  faq_q3: string;
  faq_a3: string;
  faq_q4: string;
  faq_a4: string;
  faq_q5: string;
  faq_a5: string;
  faq_q6: string;
  faq_a6: string;
  faq_q7: string;
  faq_a7: string;

  // Footer
  footer_rights: string;
  footer_terms: string;
  footer_privacy: string;

  // Booking
  book_title: string;
  book_step_date: string;
  book_step_time: string;
  book_step_details: string;
  book_step_confirm: string;
  book_choose_day: string;
  book_choose_time: string;
  book_your_details: string;
  book_location: string;
  book_name: string;
  book_name_ph: string;
  book_email: string;
  book_phone: string;
  book_num_people: string;
  book_max_2_per_jet: string;
  book_max_capacity: string;
  book_duration: string;
  book_jetski_singular: string;
  book_jetski_plural: string;
  book_summary: string;
  book_experience: string;
  book_price: string;
  book_jetskis: string;
  book_date: string;
  book_time: string;
  book_people: string;
  book_accept_terms: string;
  book_terms: string;
  book_and: string;
  book_privacy: string;
  book_confirm: string;
  book_sending: string;
  book_success_title: string;
  book_success_desc: string;
  book_back: string;
  book_next: string;
  book_back_home: string;
  book_pack_fotos_desc: string;
  book_sent_toast: string;
  book_sent_toast_desc: string;
  book_error_toast: string;
  book_error_toast_desc: string;
  book_catering: string;
  book_catering_desc: string;
};

export type Translations = Record<Language, TranslationKeys>;

export const translations: Translations = {
  pt: {
    nav_home: "Início",
    nav_about: "Sobre Nós",
    nav_experiences: "Experiências",
    nav_safety: "Segurança",
    nav_gallery: "Galeria",
    nav_contacts: "Contactos",
    nav_affiliates: "👑 RoyalCoast Elite",
    nav_book_now: "Reservar Agora",

    hero_badge: "📍 Setúbal, Portugal",
    hero_title_1: "Sente a Liberdade",
    hero_title_2: "do Sado",
    hero_subtitle: "Aluguer de motas de água em Setúbal. Vive uma experiência inesquecível na costa de Setúbal e Tróia com as nossas aventuras náuticas.",
    hero_cta_book: "Reservar Agora",
    hero_cta_experiences: "Ver Experiências",

    about_tag: "Sobre Nós",
    about_title_1: "A energia do mar",
    about_title_2: "na palma da tua mão",
    about_desc: "A Royal Coast é uma empresa jovem e energética, focada em proporcionar momentos de pura liberdade através do aluguer de motas de água na costa de Setúbal. Com equipamento de última geração e uma equipa apaixonada, garantimos diversão com total segurança nas suas aventuras de jet ski em Tróia e Arrábida.",
    about_f1_title: "Paixão pelo Mar",
    about_f1_desc: "Nascemos da ligação ao oceano e à costa de Setúbal.",
    about_f2_title: "Segurança Total",
    about_f2_desc: "Equipamento certificado e briefing completo antes de cada saída.",
    about_f3_title: "Experiência Única",
    about_f3_desc: "Cada passeio é pensado para ser inesquecível.",
    about_f4_title: "Adrenalina Pura",
    about_f4_desc: "Velocidade e liberdade nas águas do Sado.",

    weather_tag: "Meteorologia",
    weather_title: "Previsão para Setúbal",
    weather_desc: "Consulta as condições meteorológicas antes de reservares a tua experiência.",
    weather_s1_title: "Sol",
    weather_s1_desc: "Dias de sol são perfeitos para uma aventura no mar.",
    weather_s2_title: "Vento",
    weather_s2_desc: "O vento pode criar condições mais desafiadoras.",
    weather_s3_title: "Nublado",
    weather_s3_desc: "O tempo nublado não impede a diversão.",
    weather_s4_title: "Chuva",
    weather_s4_desc: "Em caso de chuva, reagendamos a sua experiência.",
    weather_source: "Dados fornecidos pelo IPMA — Instituto Português do Mar e da Atmosfera",
    weather_modal_temp: "Temperatura",
    weather_modal_wind: "Vento",
    weather_modal_precipitation: "Precipitação",
    weather_modal_sea_state: "Estado do Mar",
    weather_modal_sunrise: "Nascer do Sol",
    weather_modal_sunset: "Pôr do Sol",

    exp_tag: "Experiências",
    exp_title: "Escolhe a tua aventura",
    exp_desc: "Do aluguer de motas de água rápido à experiência sunset, temos o pacote perfeito para as tuas aventuras em Setúbal, Tróia e Arrábida.",
    exp_tab_jetski: "Jet Ski",
    exp_tab_boats: "Barcos",
    exp_tab_boats_soon: "Barcos (Em breve!)",
    exp_tab_extras: "Extras",
    exp_most_popular: "Mais Popular",
    exp_book: "Reservar",
    exp_book_now: "Reservar Agora",
    exp_view_details: "Ver Detalhes e Preços",
    exp_max_2: "Máx. 2 pessoas por mota",
    exp_photos_optional: "Pack Fotos opcional",
    exp_15min: "15 Minutos",
    exp_30min: "30 Minutos",
    exp_1hour: "1 Hora",
    exp_group: "Pack Grupo",
    exp_sunset: "Experiência Sunset",
    exp_photos: "Pack Fotos",
    exp_towable: "Boia Rebocável",
    exp_inc_1jetski: "1 mota de água",
    exp_inc_lifejacket: "Colete salva-vidas",
    exp_inc_briefing: "Briefing de segurança",
    exp_inc_insurance: "Seguro incluído",
    exp_inc_4jetski: "4 motas de água",
    exp_inc_1hour: "1 hora completa",
    exp_inc_guide: "Guia dedicado",
    exp_inc_sunset_1h: "1 hora ao pôr do sol",
    exp_inc_arrabida: "Rota pela Arrábida",
    exp_inc_photos: "Fotos da experiência",
    exp_inc_15photos: "15 fotos profissionais",
    exp_inc_proediting: "Edição profissional",
    exp_inc_24h: "Entrega digital em 24h",
    exp_inc_highres: "Alta resolução",
    exp_inc_towable_ride: "1 passeio de boia rebocável",
    exp_inc_photos_included: "Pack Fotos Incluído",
    boat_people: "pessoas",
    boat_half_day: "Meio dia (4h)",
    boat_full_day: "Dia inteiro (8h)",
    boat_inc_fuel: "Combustível incluído",
    boat_inc_lifejacket: "Coletes salva-vidas",
    boat_inc_briefing: "Briefing de segurança",
    boat_inc_insurance: "Seguro incluído",
    boat_range_all: "Tudo",
    boat_range_low: "Gama Baixa",
    boat_range_mid: "Gama Média",
    boat_range_high: "Gama Alta",

    safety_tag: "Segurança",
    safety_title: "A tua segurança é a nossa prioridade",
    safety_desc: "Diversão sem preocupações. Tudo pensado ao detalhe para que aproveites ao máximo.",
    safety_s1_title: "Equipamento de Segurança",
    safety_s1_desc: "Coletes salva-vidas certificados e disponíveis para todos os participantes.",
    safety_s2_title: "Briefing Completo",
    safety_s2_desc: "Antes de cada saída, a nossa equipa fornece um briefing de segurança detalhado.",
    safety_s3_title: "Monitores Certificados",
    safety_s3_desc: "Acompanhamento constante por monitores experientes e credenciados.",
    safety_s4_title: "Seguro Incluído",
    safety_s4_desc: "Todas as nossas experiências incluem seguro de acidentes pessoais e responsabilidade civil.",

    gallery_tag: "Galeria",
    gallery_title: "Momentos que ficam",
    gallery_cta: "Ver Todas",
    gallery_title_full: "Galeria Completa",
    gallery_desc_full: "Momentos inesquecíveis capturados nas nossas aventuras.",

    test_tag: "Testemunhos",
    test_title: "O que dizem os aventureiros",
    test_r1_name: "Miguel Santos",
    test_r1_text: "Experiência incrível! A equipa foi super profissional e a costa da Arrábida vista do mar é de outro mundo. Já reservei para o próximo verão!",
    test_r2_name: "Ana Costa",
    test_r2_text: "A experiência sunset foi mágica. Adrenalina + pôr do sol = perfeição! Recomendo a 100%.",
    test_r3_name: "Ricardo Lopes",
    test_r3_text: "Fomos em grupo e foi o melhor programa do verão. Organização impecável e muita diversão. Top!",

    contact_tag: "Contactos",
    contact_title: "Vamos à aventura?",
    contact_desc: "Entra em contacto para o aluguer de motas de água e reserva já a tua experiência em Setúbal.",
    contact_phone: "Telefone",
    contact_whatsapp: "WhatsApp",
    contact_whatsapp_desc: "Envia-nos mensagem a qualquer hora",
    contact_email: "Email",
    contact_instagram: "Instagram",
    contact_hours: "Horário",
    contact_hours_1: "Maio a Setembro: 9h – 20h",
    contact_location: "Localização",
    contact_loc_1: "Avenida Jaime Rebelo 41",
    contact_loc_2: "2904-503 Setúbal",
    contact_form_name: "Nome",
    contact_form_name_ph: "O teu nome",
    contact_form_email: "Email",
    contact_form_message: "Mensagem",
    contact_form_message_ph: "Gostava de reservar para...",
    contact_form_send: "Enviar Mensagem",

    faq_title: "Perguntas Frequentes",
    faq_desc: "Tudo o que precisas de saber antes da tua experiência.",
    faq_q1: "Preciso de experiência para conduzir uma mota de água?",
    faq_a1: "Não! Antes de cada saída fazemos um briefing completo onde explicamos tudo. É super fácil e seguro.",
    faq_q2: "Qual é a idade mínima?",
    faq_a2: "A idade mínima para conduzir é 16 anos. Menores de 16 podem ir como passageiros acompanhados por um adulto.",
    faq_q3: "Posso cancelar ou reagendar a minha reserva?",
    faq_a3: "Sim, podes cancelar ou reagendar até 24 horas antes da experiência sem qualquer custo.",
    faq_q4: "O que acontece se estiver mau tempo?",
    faq_a4: "Em caso de condições meteorológicas adversas, contactamos-te para reagendar sem custos adicionais.",
    faq_q5: "O seguro está incluído?",
    faq_a5: "Sim, todas as experiências incluem seguro de acidentes pessoais e responsabilidade civil.",
    faq_q6: "Posso levar o telemóvel durante a experiência?",
    faq_a6: "Recomendamos que deixes os objetos de valor em terra. Temos cacifos disponíveis. Se optares pelo Pack Fotos, tratamos das memórias por ti!",
    faq_q7: "É preciso carta de condução para conduzir a moto de água?",
    faq_a7: "Não, não é necessário ter carta de condução para conduzir uma moto de água nas nossas experiências. Todas as atividades são supervisionadas por instrutores certificados que te acompanham durante todo o percurso. Antes de cada sessão, recebes um briefing completo sobre os comandos e regras de segurança. A nossa equipa garante que te sintas confortável e seguro, independentemente da tua experiência prévia. Basta teres vontade de te divertir!",

    footer_rights: "Todos os direitos reservados.",
    footer_terms: "Termos",
    footer_privacy: "Privacidade",

    book_title: "Reservar",
    book_step_date: "Data",
    book_step_time: "Hora",
    book_step_details: "Detalhes",
    book_step_confirm: "Confirmação",
    book_choose_day: "Escolhe o dia",
    book_choose_time: "Escolhe a hora",
    book_your_details: "Os teus dados",
    book_location: "Local",
    book_name: "Nome",
    book_name_ph: "O teu nome",
    book_email: "Email",
    book_phone: "Telemóvel",
    book_num_people: "Nº de pessoas",
    book_max_2_per_jet: "Máx. 2 pessoas por mota",
    book_max_capacity: "Lotação máxima",
    book_duration: "Duração",
    book_jetski_singular: "mota",
    book_jetski_plural: "motas",
    book_summary: "Resumo da reserva",
    book_experience: "Experiência",
    book_price: "Preço",
    book_jetskis: "Motas de água",
    book_date: "Data",
    book_time: "Hora",
    book_people: "Pessoas",
    book_accept_terms: "Li e aceito os",
    book_terms: "Termos e Condições",
    book_and: "e a",
    book_privacy: "Política de Privacidade",
    book_confirm: "Confirmar Reserva",
    book_sending: "A enviar...",
    book_success_title: "Reserva Enviada!",
    book_success_desc: "Enviámos um email de confirmação para",
    book_back: "Voltar",
    book_next: "Seguinte",
    book_back_home: "Voltar ao Início",
    book_pack_fotos_desc: "15 fotos profissionais editadas, entrega digital em 24h",
    book_sent_toast: "Reserva enviada!",
    book_sent_toast_desc: "Receberás um email de confirmação em breve.",
    book_error_toast: "Erro ao enviar",
    book_error_toast_desc: "Tenta novamente ou contacta-nos diretamente.",
    book_catering: "Serviço de Catering",
    book_catering_desc: "Tábua de queijos e enchidos, snacks, bebidas frescas e frutas da época.",
  },

  en: {
    nav_home: "Home",
    nav_about: "About Us",
    nav_experiences: "Experiences",
    nav_safety: "Safety",
    nav_gallery: "Gallery",
    nav_contacts: "Contact",
    nav_affiliates: "👑 RoyalCoast Elite",
    nav_book_now: "Book Now",

    hero_badge: "📍 Setúbal, Portugal",
    hero_title_1: "Feel the Freedom",
    hero_title_2: "of the Sado",
    hero_subtitle: "Live an unforgettable experience on the coast of Setúbal with our nautical adventures.",
    hero_cta_book: "Book Now",
    hero_cta_experiences: "View Experiences",

    about_tag: "About Us",
    about_title_1: "The energy of the sea",
    about_title_2: "in the palm of your hand",
    about_desc: "Royal Coast is a young and energetic company, focused on providing moments of pure freedom on the coast of Setúbal. With state-of-the-art equipment and a passionate team, we guarantee fun with total safety.",
    about_f1_title: "Passion for the Sea",
    about_f1_desc: "Born from our connection to the ocean and the coast of Setúbal.",
    about_f2_title: "Total Safety",
    about_f2_desc: "Certified equipment and full briefing before every ride.",
    about_f3_title: "Unique Experience",
    about_f3_desc: "Every ride is designed to be unforgettable.",
    about_f4_title: "Pure Adrenaline",
    about_f4_desc: "Speed and freedom on the waters of the Sado.",

    weather_tag: "Weather",
    weather_title: "Setúbal Forecast",
    weather_desc: "Check the weather conditions before booking your experience.",
    weather_s1_title: "Sun",
    weather_s1_desc: "Sunny days are perfect for an adventure at sea.",
    weather_s2_title: "Wind",
    weather_s2_desc: "The wind can create more challenging conditions.",
    weather_s3_title: "Cloudy",
    weather_s3_desc: "Cloudy weather doesn\'t stop the fun.",
    weather_s4_title: "Rain",
    weather_s4_desc: "In case of rain, we will reschedule your experience.",
    weather_source: "Data provided by IPMA — Portuguese Institute for Sea and Atmosphere",
    weather_modal_temp: "Temperature",
    weather_modal_wind: "Wind",
    weather_modal_precipitation: "Precipitation",
    weather_modal_sea_state: "Sea State",
    weather_modal_sunrise: "Sunrise",
    weather_modal_sunset: "Sunset",

    exp_tag: "Experiences",
    exp_title: "Choose your adventure",
    exp_desc: "From a quick ride to a sunset experience, we have the perfect package for you.",
    exp_tab_jetski: "Jet Ski",
    exp_tab_boats: "Boats",
    exp_tab_boats_soon: "Boats (Coming soon!)",
    exp_tab_extras: "Extras",
    exp_most_popular: "Most Popular",
    exp_book: "Book",
    exp_book_now: "Book Now",
    exp_view_details: "View Details and Prices",
    exp_max_2: "Max. 2 people per jet ski",
    exp_photos_optional: "Optional Photo Pack",
    exp_15min: "15 Minutes",
    exp_30min: "30 Minutes",
    exp_1hour: "1 Hour",
    exp_group: "Group Pack",
    exp_sunset: "Sunset Experience",
    exp_photos: "Photo Pack",
    exp_towable: "Towable Buoy",
    exp_inc_1jetski: "1 jet ski",
    exp_inc_lifejacket: "Life jacket",
    exp_inc_briefing: "Safety briefing",
    exp_inc_insurance: "Insurance included",
    exp_inc_4jetski: "4 jet skis",
    exp_inc_1hour: "1 full hour",
    exp_inc_guide: "Dedicated guide",
    exp_inc_sunset_1h: "1 hour at sunset",
    exp_inc_arrabida: "Arrábida route",
    exp_inc_photos: "Experience photos",
    exp_inc_15photos: "15 professional photos",
    exp_inc_proediting: "Professional editing",
    exp_inc_24h: "Digital delivery in 24h",
    exp_inc_highres: "High resolution",
    exp_inc_towable_ride: "1 towable buoy ride",
    exp_inc_photos_included: "Photo Pack Included",
    boat_people: "people",
    boat_half_day: "Half day (4h)",
    boat_full_day: "Full day (8h)",
    boat_inc_fuel: "Fuel included",
    boat_inc_lifejacket: "Life jackets",
    boat_inc_briefing: "Safety briefing",
    boat_inc_insurance: "Insurance included",
    boat_range_all: "All",
    boat_range_low: "Low Range",
    boat_range_mid: "Mid Range",
    boat_range_high: "High Range",

    safety_tag: "Safety",
    safety_title: "Your safety is our priority",
    safety_desc: "Fun without worries. Everything is thought out in detail so you can make the most of it.",
    safety_s1_title: "Safety Equipment",
    safety_s1_desc: "Certified life jackets available for all participants.",
    safety_s2_title: "Complete Briefing",
    safety_s2_desc: "Before each departure, our team provides a detailed safety briefing.",
    safety_s3_title: "Certified Instructors",
    safety_s3_desc: "Constant supervision by experienced and certified instructors.",
    safety_s4_title: "Insurance Included",
    safety_s4_desc: "All our experiences include personal accident and liability insurance.",

    gallery_tag: "Gallery",
    gallery_title: "Moments that last",
    gallery_cta: "View All",
    gallery_title_full: "Full Gallery",
    gallery_desc_full: "Unforgettable moments captured on our adventures.",

    test_tag: "Testimonials",
    test_title: "What adventurers say",
    test_r1_name: "Miguel Santos",
    test_r1_text: "Incredible experience! The team was super professional and the Arrábida coast seen from the sea is out of this world. Already booked for next summer!",
    test_r2_name: "Ana Costa",
    test_r2_text: "The sunset experience was magical. Adrenaline + sunset = perfection! 100% recommended.",
    test_r3_name: "Ricardo Lopes",
    test_r3_text: "We went as a group and it was the best summer activity. Impeccable organization and lots of fun. Top!",

    contact_tag: "Contact",
    contact_title: "Ready for adventure?",
    contact_desc: "Get in touch and book your experience now.",
    contact_phone: "Phone",
    contact_whatsapp: "WhatsApp",
    contact_whatsapp_desc: "Send us a message anytime",
    contact_email: "Email",
    contact_instagram: "Instagram",
    contact_hours: "Hours",
    contact_hours_1: "May to September: 9am – 8pm",
    contact_location: "Location",
    contact_loc_1: "Avenida Jaime Rebelo 41",
    contact_loc_2: "2904-503 Setúbal",
    contact_form_name: "Name",
    contact_form_name_ph: "Your name",
    contact_form_email: "Email",
    contact_form_message: "Message",
    contact_form_message_ph: "I\'d like to book for...",
    contact_form_send: "Send Message",

    faq_title: "Frequently Asked Questions",
    faq_desc: "Everything you need to know before your experience.",
    faq_q1: "Do I need experience to ride a jet ski?",
    faq_a1: "No! We provide a full safety briefing before every ride. It\'s super easy and safe.",
    faq_q2: "What is the minimum age?",
    faq_a2: "The minimum age to drive is 16. Under 16s can ride as passengers accompanied by an adult.",
    faq_q3: "Can I cancel or reschedule my booking?",
    faq_a3: "Yes, you can cancel or reschedule up to 24 hours before the experience at no cost.",
    faq_q4: "What happens if the weather is bad?",
    faq_a4: "In case of adverse weather, we\'ll contact you to reschedule at no extra charge.",
    faq_q5: "Is insurance included?",
    faq_a5: "Yes, all experiences include personal accident and liability insurance.",
    faq_q6: "Can I bring my phone during the experience?",
    faq_a6: "We recommend leaving valuables on shore. Lockers are available. If you opt for the Photo Pack, we\'ll capture the memories for you!",
    faq_q7: "Do I need a driving licence to ride a jet ski?",
    faq_a7: "No, you don\'t need a driving licence to ride a jet ski during our experiences. All activities are supervised by certified instructors who accompany you throughout the ride. Before each session, you\'ll receive a full briefing on controls and safety rules. Our team ensures you feel comfortable and safe, regardless of your previous experience. All you need is the desire to have fun!",

    footer_rights: "All rights reserved.",
    footer_terms: "Terms",
    footer_privacy: "Privacy",

    book_title: "Book",
    book_step_date: "Date",
    book_step_time: "Time",
    book_step_details: "Details",
    book_step_confirm: "Confirmation",
    book_choose_day: "Choose the day",
    book_choose_time: "Choose the time",
    book_your_details: "Your details",
    book_location: "Location",
    book_name: "Name",
    book_name_ph: "Your name",
    book_email: "Email",
    book_phone: "Phone",
    book_num_people: "Number of people",
    book_max_2_per_jet: "Max. 2 people per jet ski",
    book_max_capacity: "Max capacity",
    book_duration: "Duration",
    book_jetski_singular: "jet ski",
    book_jetski_plural: "jet skis",
    book_summary: "Booking summary",
    book_experience: "Experience",
    book_price: "Price",
    book_jetskis: "Jet skis",
    book_date: "Date",
    book_time: "Time",
    book_people: "People",
    book_accept_terms: "I have read and accept the",
    book_terms: "Terms and Conditions",
    book_and: "and the",
    book_privacy: "Privacy Policy",
    book_confirm: "Confirm Booking",
    book_sending: "Sending...",
    book_success_title: "Booking Sent!",
    book_success_desc: "We sent a confirmation email to",
    book_back: "Back",
    book_next: "Next",
    book_back_home: "Back to Home",
    book_pack_fotos_desc: "15 professionally edited photos, digital delivery in 24h",
    book_sent_toast: "Booking sent!",
    book_sent_toast_desc: "You will receive a confirmation email shortly.",
    book_error_toast: "Error sending",
    book_error_toast_desc: "Please try again or contact us directly.",
    book_catering: "Catering Service",
    book_catering_desc: "Cheese and charcuterie board, snacks, cold drinks and seasonal fruits.",
  },

  de: {
    nav_home: "Start",
    nav_about: "Über Uns",
    nav_experiences: "Erlebnisse",
    nav_safety: "Sicherheit",
    nav_gallery: "Galerie",
    nav_contacts: "Kontakt",
    nav_affiliates: "👑 RoyalCoast Elite",
    nav_book_now: "Jetzt Buchen",

    hero_badge: "📍 Setúbal, Portugal",
    hero_title_1: "Spüre die Freiheit",
    hero_title_2: "des Sado",
    hero_subtitle: "Erlebe ein unvergessliches Abenteuer an der Küste von Setúbal mit unseren nautischen Erlebnissen.",
    hero_cta_book: "Jetzt Buchen",
    hero_cta_experiences: "Erlebnisse Ansehen",

    about_tag: "Über Uns",
    about_title_1: "Die Energie des Meeres",
    about_title_2: "in deiner Hand",
    about_desc: "Royal Coast ist ein junges und energiegeladenes Unternehmen, das sich darauf konzentriert, Momente purer Freiheit an der Küste von Setúbal zu bieten. Mit modernster Ausrüstung und einem leidenschaftlichen Team garantieren wir Spaß mit höchster Sicherheit.",
    about_f1_title: "Leidenschaft fürs Meer",
    about_f1_desc: "Geboren aus der Verbindung zum Ozean und der Küste von Setúbal.",
    about_f2_title: "Totale Sicherheit",
    about_f2_desc: "Zertifizierte Ausrüstung und vollständiges Briefing vor jeder Fahrt.",
    about_f3_title: "Einzigartiges Erlebnis",
    about_f3_desc: "Jede Fahrt ist darauf ausgelegt, unvergesslich zu sein.",
    about_f4_title: "Pures Adrenalin",
    about_f4_desc: "Geschwindigkeit und Freiheit auf den Gewässern des Sado.",

    weather_tag: "Wetter",
    weather_title: "Vorhersage für Setúbal",
    weather_desc: "Prüfe die Wetterbedingungen, bevor du dein Erlebnis buchst.",
    weather_s1_title: "Sonne",
    weather_s1_desc: "Sonnige Tage sind perfekt für ein Abenteuer auf See.",
    weather_s2_title: "Wind",
    weather_s2_desc: "Der Wind kann anspruchsvollere Bedingungen schaffen.",
    weather_s3_title: "Bewölkt",
    weather_s3_desc: "Bewölktes Wetter stoppt den Spaß nicht.",
    weather_s4_title: "Regen",
    weather_s4_desc: "Bei Regen werden wir dein Erlebnis verschieben.",
    weather_source: "Daten bereitgestellt von IPMA — Portugiesisches Institut für Meer und Atmosphäre",
    weather_modal_temp: "Temperatur",
    weather_modal_wind: "Wind",
    weather_modal_precipitation: "Niederschlag",
    weather_modal_sea_state: "Seegang",
    weather_modal_sunrise: "Sonnenaufgang",
    weather_modal_sunset: "Sonnenuntergang",

    exp_tag: "Erlebnisse",
    exp_title: "Wähle dein Abenteuer",
    exp_desc: "Von der schnellen Fahrt bis zum Sonnenuntergangserlebnis – wir haben das perfekte Paket für dich.",
    exp_tab_jetski: "Jet Ski",
    exp_tab_boats: "Boote",
    exp_tab_boats_soon: "Boote (Demnächst!)",
    exp_tab_extras: "Extras",
    exp_most_popular: "Am Beliebtesten",
    exp_book: "Buchen",
    exp_book_now: "Jetzt buchen",
    exp_view_details: "Details und Preise anzeigen",
    exp_max_2: "Max. 2 Personen pro Jetski",
    exp_photos_optional: "Optionales Fotopaket",
    exp_15min: "15 Minuten",
    exp_30min: "30 Minuten",
    exp_1hour: "1 Stunde",
    exp_group: "Gruppenpaket",
    exp_sunset: "Sonnenuntergang",
    exp_photos: "Fotopaket",
    exp_towable: "Schlauchboot",
    exp_inc_1jetski: "1 Jetski",
    exp_inc_lifejacket: "Schwimmweste",
    exp_inc_briefing: "Sicherheitsbriefing",
    exp_inc_insurance: "Versicherung inklusive",
    exp_inc_4jetski: "4 Jetskis",
    exp_inc_1hour: "1 volle Stunde",
    exp_inc_guide: "Persönlicher Guide",
    exp_inc_sunset_1h: "1 Stunde bei Sonnenuntergang",
    exp_inc_arrabida: "Arrábida-Route",
    exp_inc_photos: "Erlebnisfotos",
    exp_inc_15photos: "15 professionelle Fotos",
    exp_inc_proediting: "Professionelle Bearbeitung",
    exp_inc_24h: "Digitale Lieferung in 24h",
    exp_inc_highres: "Hohe Auflösung",
    exp_inc_towable_ride: "1 Schlauchboot-Fahrt",
    exp_inc_photos_included: "Fotopaket Inbegriffen",
    boat_people: "Personen",
    boat_half_day: "Halber Tag (4h)",
    boat_full_day: "Ganzer Tag (8h)",
    boat_inc_fuel: "Kraftstoff inklusive",
    boat_inc_lifejacket: "Schwimmwesten",
    boat_inc_briefing: "Sicherheitsbriefing",
    boat_inc_insurance: "Versicherung inklusive",
    boat_range_all: "Alle",
    boat_range_low: "Gama Baixa",
    boat_range_mid: "Gama Média",
    boat_range_high: "Gama Alta",

    safety_tag: "Sicherheit",
    safety_title: "Deine Sicherheit hat Priorität",
    safety_desc: "Spaß ohne Sorgen. Alles bis ins Detail durchdacht, damit du das Beste daraus machen kannst.",
    safety_s1_title: "Sicherheitsausrüstung",
    safety_s1_desc: "Zertifizierte Schwimmwesten für alle Teilnehmer verfügbar.",
    safety_s2_title: "Vollständiges Briefing",
    safety_s2_desc: "Vor jeder Fahrt gibt unser Team eine detaillierte Sicherheitseinweisung.",
    safety_s3_title: "Zertifizierte Instruktoren",
    safety_s3_desc: "Ständige Aufsicht durch erfahrene und zertifizierte Instruktoren.",
    safety_s4_title: "Versicherung Inklusive",
    safety_s4_desc: "Alle unsere Erlebnisse beinhalten eine Personen-Unfall- und Haftpflichtversicherung.",

    gallery_tag: "Galerie",
    gallery_title: "Momente die bleiben",
    gallery_cta: "Alle ansehen",
    gallery_title_full: "Vollständige Galerie",
    gallery_desc_full: "Unvergessliche Momente, die auf unseren Abenteuern festgehalten wurden.",

    test_tag: "Bewertungen",
    test_title: "Was Abenteurer sagen",
    test_r1_name: "Miguel Santos",
    test_r1_text: "Unglaubliches Erlebnis! Das Team war super professionell und die Arrábida-Küste vom Meer aus ist atemberaubend. Schon für nächsten Sommer gebucht!",
    test_r2_name: "Ana Costa",
    test_r2_text: "Das Sonnenuntergangserlebnis war magisch. Adrenalin + Sonnenuntergang = Perfektion! 100% empfehlenswert.",
    test_r3_name: "Ricardo Lopes",
    test_r3_text: "Wir waren als Gruppe dort und es war das beste Sommerprogramm. Perfekte Organisation und viel Spaß. Top!",

    contact_tag: "Kontakt",
    contact_title: "Bereit fürs Abenteuer?",
    contact_desc: "Kontaktiere uns und buche jetzt dein Erlebnis.",
    contact_phone: "Telefon",
    contact_whatsapp: "WhatsApp",
    contact_whatsapp_desc: "Schreib uns jederzeit eine Nachricht",
    contact_email: "E-Mail",
    contact_instagram: "Instagram",
    contact_hours: "Öffnungszeiten",
    contact_hours_1: "Mai bis September: 9 – 20 Uhr",
    contact_location: "Standort",
    contact_loc_1: "Avenida Jaime Rebelo 41",
    contact_loc_2: "2904-503 Setúbal",
    contact_form_name: "Name",
    contact_form_name_ph: "Dein Name",
    contact_form_email: "E-Mail",
    contact_form_message: "Nachricht",
    contact_form_message_ph: "Ich möchte buchen für...",
    contact_form_send: "Nachricht Senden",

    faq_title: "Häufige Fragen",
    faq_desc: "Alles, was du vor deinem Erlebnis wissen musst.",
    faq_q1: "Brauche ich Erfahrung, um einen Jetski zu fahren?",
    faq_a1: "Nein! Wir geben vor jeder Fahrt ein vollständiges Sicherheitsbriefing. Es ist super einfach und sicher.",
    faq_q2: "Was ist das Mindestalter?",
    faq_a2: "Das Mindestalter zum Fahren ist 16 Jahre. Unter 16-Jährige können als Beifahrer mit einem Erwachsenen mitfahren.",
    faq_q3: "Kann ich meine Buchung stornieren oder umbuchen?",
    faq_a3: "Ja, du kannst bis 24 Stunden vor dem Erlebnis kostenlos stornieren oder umbuchen.",
    faq_q4: "Was passiert bei schlechtem Wetter?",
    faq_a4: "Bei widrigen Wetterbedingungen kontaktieren wir dich, um kostenlos umzubuchen.",
    faq_q5: "Ist eine Versicherung enthalten?",
    faq_a5: "Ja, alle Erlebnisse beinhalten eine Unfall- und Haftpflichtversicherung.",
    faq_q6: "Kann ich mein Handy mitnehmen?",
    faq_a6: "Wir empfehlen, Wertsachen an Land zu lassen. Schließfächer sind vorhanden. Mit dem Fotopaket halten wir die Erinnerungen für dich fest!",
    faq_q7: "Brauche ich einen Führerschein, um einen Jetski zu fahren?",
    faq_a7: "Nein, du brauchst keinen Führerschein, um bei unseren Erlebnissen Jetski zu fahren. Alle Aktivitäten werden von zertifizierten Instruktoren begleitet, die dich während der gesamten Fahrt begleiten. Vor jeder Session erhältst du eine ausführliche Einweisung in die Steuerung und Sicherheitsregeln. Unser Team sorgt dafür, dass du dich wohl und sicher fühlst, unabhängig von deiner Vorerfahrung. Du brauchst nur Lust auf Spaß!",

    footer_rights: "Alle Rechte vorbehalten.",
    footer_terms: "AGB",
    footer_privacy: "Datenschutz",

    book_title: "Buchen",
    book_step_date: "Datum",
    book_step_time: "Uhrzeit",
    book_step_details: "Details",
    book_step_confirm: "Bestätigung",
    book_choose_day: "Wähle den Tag",
    book_choose_time: "Wähle die Uhrzeit",
    book_your_details: "Deine Daten",
    book_location: "Standort",
    book_name: "Name",
    book_name_ph: "Dein Name",
    book_email: "E-Mail",
    book_phone: "Telefon",
    book_num_people: "Anzahl Personen",
    book_max_2_per_jet: "Max. 2 Personen pro Jetski",
    book_max_capacity: "Maximale Kapazität",
    book_duration: "Dauer",
    book_jetski_singular: "Jetski",
    book_jetski_plural: "Jetskis",
    book_summary: "Buchungsübersicht",
    book_experience: "Erlebnis",
    book_price: "Preis",
    book_jetskis: "Jetskis",
    book_date: "Datum",
    book_time: "Uhrzeit",
    book_people: "Personen",
    book_accept_terms: "Ich habe die",
    book_terms: "AGB",
    book_and: "und die",
    book_privacy: "Datenschutzerklärung",
    book_confirm: "Buchung Bestätigen",
    book_sending: "Wird gesendet...",
    book_success_title: "Buchung Gesendet!",
    book_success_desc: "Wir haben eine Bestätigungs-E-Mail gesendet an",
    book_back: "Zurück",
    book_next: "Weiter",
    book_back_home: "Zurück zur Startseite",
    book_pack_fotos_desc: "15 professionell bearbeitete Fotos, digitale Lieferung in 24h",
    book_sent_toast: "Buchung gesendet!",
    book_sent_toast_desc: "Du erhältst in Kürze eine Bestätigungs-E-Mail.",
    book_error_toast: "Fehler beim Senden",
    book_error_toast_desc: "Bitte versuchen Sie es erneut oder kontaktiere uns direkt.",
    book_catering: "Catering-Service",
    book_catering_desc: "Käse- und Wurstplatte, Snacks, kühle Getränke und saisonale Früchte.",
  },

  es: {
    nav_home: "Inicio",
    nav_about: "Sobre Nosotros",
    nav_experiences: "Experiencias",
    nav_safety: "Seguridad",
    nav_gallery: "Galería",
    nav_contacts: "Contacto",
    nav_affiliates: "🎁 Afiliados",
    nav_book_now: "Reservar Ahora",

    hero_badge: "📍 Setúbal, Portugal",
    hero_title_1: "Siente la Libertad",
    hero_title_2: "del Sado",
    hero_subtitle: "Vive una experiencia inolvidable en la costa de Setúbal con nuestras aventuras náuticas.",
    hero_cta_book: "Reservar Ahora",
    hero_cta_experiences: "Ver Experiencias",

    about_tag: "Sobre Nosotros",
    about_title_1: "La energía del mar",
    about_title_2: "en la palma de tu mano",
    about_desc: "Royal Coast es una empresa joven y enérgica, enfocada en proporcionar momentos de pura libertad en la costa de Setúbal. Con equipamiento de última generación y un equipo apasionado, garantizamos diversión con total seguridad.",
    about_f1_title: "Pasión por el Mar",
    about_f1_desc: "Nacimos de la conexión con el océano y la costa de Setúbal.",
    about_f2_title: "Seguridad Total",
    about_f2_desc: "Equipamiento certificado y briefing completo antes de cada salida.",
    about_f3_title: "Experiencia Única",
    about_f3_desc: "Cada paseo está pensado para ser inolvidable.",
    about_f4_title: "Adrenalina Pura",
    about_f4_desc: "Velocidad y libertad en las aguas del Sado.",

    weather_tag: "Meteorología",
    weather_title: "Previsión para Setúbal",
    weather_desc: "Consulta las condiciones meteorológicas antes de reservar tu experiencia.",
    weather_s1_title: "Sol",
    weather_s1_desc: "Los días soleados son perfectos para una aventura en el mar.",
    weather_s2_title: "Viento",
    weather_s2_desc: "El viento puede crear condiciones más desafiantes.",
    weather_s3_title: "Nublado",
    weather_s3_desc: "El tiempo nublado no detiene la diversión.",
    weather_s4_title: "Lluvia",
    weather_s4_desc: "En caso de lluvia, reprogramaremos su experiencia.",
    weather_source: "Datos proporcionados por IPMA — Instituto Portugués del Mar y la Atmósfera",
    weather_modal_temp: "Temperatura",
    weather_modal_wind: "Viento",
    weather_modal_precipitation: "Precipitación",
    weather_modal_sea_state: "Estado del Mar",
    weather_modal_sunrise: "Amanecer",
    weather_modal_sunset: "Atardecer",

    exp_tag: "Experiencias",
    exp_title: "Elige tu aventura",
    exp_desc: "Del paseo rápido a la experiencia sunset, tenemos el paquete perfecto para ti.",
    exp_tab_jetski: "Jet Ski",
    exp_tab_boats: "Barcos",
    exp_tab_boats_soon: "Barcos (¡Próximamente!)",
    exp_tab_extras: "Extras",
    exp_most_popular: "Más Popular",
    exp_book: "Reservar",
    exp_book_now: "Reservar ahora",
    exp_view_details: "Ver detalles y precios",
    exp_max_2: "Máx. 2 personas por moto",
    exp_photos_optional: "Pack Fotos opcional",
    exp_15min: "15 Minutos",
    exp_30min: "30 Minutos",
    exp_1hour: "1 Hora",
    exp_group: "Pack Grupo",
    exp_sunset: "Experiencia Sunset",
    exp_photos: "Pack Fotos",
    exp_towable: "Boya Remolcable",
    exp_inc_1jetski: "1 moto de agua",
    exp_inc_lifejacket: "Chaleco salvavidas",
    exp_inc_briefing: "Briefing de seguridad",
    exp_inc_insurance: "Seguro incluido",
    exp_inc_4jetski: "4 motos de agua",
    exp_inc_1hour: "1 hora completa",
    exp_inc_guide: "Guía dedicado",
    exp_inc_sunset_1h: "1 hora al atardecer",
    exp_inc_arrabida: "Ruta por Arrábida",
    exp_inc_photos: "Fotos de la experiencia",
    exp_inc_15photos: "15 fotos profesionales",
    exp_inc_proediting: "Edición profesional",
    exp_inc_24h: "Entrega digital en 24h",
    exp_inc_highres: "Alta resolución",
    exp_inc_towable_ride: "1 paseo de boya remolcable",
    exp_inc_photos_included: "Pack de Fotos Incluido",
    boat_people: "personas",
    boat_half_day: "Medio día (4h)",
    boat_full_day: "Día completo (8h)",
    boat_inc_fuel: "Combustible incluido",
    boat_inc_lifejacket: "Chalecos salvavidas",
    boat_inc_briefing: "Briefing de seguridad",
    boat_inc_insurance: "Seguro incluido",
    boat_range_all: "Todo",
    boat_range_low: "Gama Baja",
    boat_range_mid: "Gama Media",
    boat_range_high: "Gama Alta",

    safety_tag: "Seguridad",
    safety_title: "Tu seguridad es nuestra prioridad",
    safety_desc: "Diversión sin preocupaciones. Todo pensado al detalle para que disfrutes al máximo.",
    safety_s1_title: "Equipo de Seguridad",
    safety_s1_desc: "Chalecos salvavidas certificados y disponibles para todos los participantes.",
    safety_s2_title: "Briefing Completo",
    safety_s2_desc: "Antes de cada salida, nuestro equipo proporciona un briefing de seguridad detallado.",
    safety_s3_title: "Monitores Certificados",
    safety_s3_desc: "Supervisión constante por monitores experimentados y certificados.",
    safety_s4_title: "Seguro Incluido",
    safety_s4_desc: "Todas nuestras experiencias incluyen seguro de accidentes personales y responsabilidad civil.",

    gallery_tag: "Galería",
    gallery_title: "Momentos que perduran",
    gallery_cta: "Ver Todas",
    gallery_title_full: "Galería Completa",
    gallery_desc_full: "Momentos inolvidables capturados en nuestras aventuras.",

    test_tag: "Testimonios",
    test_title: "Lo que dicen los aventureros",
    test_r1_name: "Miguel Santos",
    test_r1_text: "¡Experiencia increíble! El equipo fue súper profesional y la costa de Arrábida vista desde el mar es de otro mundo. ¡Ya reservé para el próximo verano!",
    test_r2_name: "Ana Costa",
    test_r2_text: "La experiencia sunset fue mágica. ¡Adrenalina + atardecer = perfección! Lo recomiendo al 100%.",
    test_r3_name: "Ricardo Lopes",
    test_r3_text: "Fuimos en grupo y fue el mejor programa del verano. ¡Organización impecable y mucha diversión. Top!",

    contact_tag: "Contacto",
    contact_title: "¿Vamos a la aventura?",
    contact_desc: "Ponte en contacto y reserva ya tu experiencia.",
    contact_phone: "Teléfono",
    contact_whatsapp: "WhatsApp",
    contact_whatsapp_desc: "Envíanos un mensaje a cualquier hora",
    contact_email: "Email",
    contact_instagram: "Instagram",
    contact_hours: "Horario",
    contact_hours_1: "Mayo a Septiembre: 9h – 20h",
    contact_location: "Ubicación",
    contact_loc_1: "Avenida Jaime Rebelo 41",
    contact_loc_2: "2904-503 Setúbal",
    contact_form_name: "Nombre",
    contact_form_name_ph: "Tu nombre",
    contact_form_email: "Email",
    contact_form_message: "Mensaje",
    contact_form_message_ph: "Me gustaría reservar para...",
    contact_form_send: "Enviar Mensaje",

    faq_title: "Preguntas Frecuentes",
    faq_desc: "Todo lo que necesitas saber antes de tu experiencia.",
    faq_q1: "¿Necesito experiencia para conducir una moto de agua?",
    faq_a1: "¡No! Antes de cada salida hacemos un briefing completo. Es súper fácil y seguro.",
    faq_q2: "¿Cuál es la edad mínima?",
    faq_a2: "La edad mínima para conducir es 16 años. Los menores de 16 pueden ir como pasajeros acompañados por un adulto.",
    faq_q3: "¿Puedo cancelar o reprogramar mi reserva?",
    faq_a3: "Sí, puedes cancelar o reprogramar hasta 24 horas antes de la experiencia sin coste.",
    faq_q4: "¿Qué pasa si hace mal tiempo?",
    faq_a4: "En caso de condiciones adversas, te contactamos para reprogramar sin coste adicional.",
    faq_q5: "¿El seguro está incluido?",
    faq_a5: "Sí, todas las experiencias incluyen seguro de accidentes personales y responsabilidad civil.",
    faq_q6: "¿Puedo llevar el móvil durante la experiencia?",
    faq_a6: "Recomendamos dejar los objetos de valor en tierra. Hay taquillas disponibles. ¡Si eliges el Pack Fotos, nos encargamos de los recuerdos!",
    faq_q7: "¿Se necesita carné de conducir para pilotar la moto de agua?",
    faq_a7: "No, no es necesario tener carné de conducir para pilotar una moto de agua en nuestras experiencias. Todas las actividades están supervisadas por instructores certificados que te acompañan durante todo el recorrido. Antes de cada sesión, recibirás una explicación completa sobre los controles y las normas de seguridad. Nuestro equipo se asegura de que te sientas cómodo y seguro, sin importar tu experiencia previa. ¡Solo necesitas ganas de divertirte!",

    footer_rights: "Todos los derechos reservados.",
    footer_terms: "Términos",
    footer_privacy: "Privacidad",

    book_title: "Reservar",
    book_step_date: "Fecha",
    book_step_time: "Hora",
    book_step_details: "Detalles",
    book_step_confirm: "Confirmación",
    book_choose_day: "Elige el día",
    book_choose_time: "Elige la hora",
    book_your_details: "Tus datos",
    book_location: "Ubicación",
    book_name: "Nombre",
    book_name_ph: "Tu nombre",
    book_email: "Email",
    book_phone: "Teléfono",
    book_num_people: "Nº de personas",
    book_max_2_per_jet: "Máx. 2 personas por moto",
    book_max_capacity: "Capacidad máxima",
    book_duration: "Duración",
    book_jetski_singular: "moto",
    book_jetski_plural: "motos",
    book_summary: "Resumen de la reserva",
    book_experience: "Experiencia",
    book_price: "Precio",
    book_jetskis: "Motos de agua",
    book_date: "Fecha",
    book_time: "Hora",
    book_people: "Personas",
    book_accept_terms: "He leído y acepto los",
    book_terms: "Términos y Condiciones",
    book_and: "y la",
    book_privacy: "Política de Privacidad",
    book_confirm: "Confirmar Reserva",
    book_sending: "Enviando...",
    book_success_title: "¡Reserva Enviada!",
    book_success_desc: "Hemos enviado un email de confirmación a",
    book_back: "Volver",
    book_next: "Siguiente",
    book_back_home: "Volver al Inicio",
    book_pack_fotos_desc: "15 fotos profesionales editadas, entrega digital en 24h",
    book_sent_toast: "¡Reserva enviada!",
    book_sent_toast_desc: "Recibirás un email de confirmación pronto.",
    book_error_toast: "Error al enviar",
    book_error_toast_desc: "Inténtalo de nuevo o contáctanos directamente.",
    book_catering: "Servicio de Catering",
    book_catering_desc: "Tabla de quesos y embutidos, snacks, bebidas frescas y frutas de temporada.",
  },

  fr: {
    nav_home: "Accueil",
    nav_about: "À Propos",
    nav_experiences: "Expériences",
    nav_safety: "Sécurité",
    nav_gallery: "Galerie",
    nav_contacts: "Contact",
    nav_affiliates: "🎁 Affiliés",
    nav_book_now: "Réserver",

    hero_badge: "📍 Setúbal, Portugal",
    hero_title_1: "Ressentez la Liberté",
    hero_title_2: "du Sado",
    hero_subtitle: "Vivez une expérience inoubliable sur la côte de Setúbal avec nos aventures nautiques.",
    hero_cta_book: "Réserver",
    hero_cta_experiences: "Voir les Expériences",

    about_tag: "À Propos",
    about_title_1: "L\'énergie de la mer",
    about_title_2: "dans le creux de votre main",
    about_desc: "Royal Coast est une entreprise jeune et dynamique, axée sur des moments de pure liberté sur la côte de Setúbal. Avec un équipement de pointe et une équipe passionnée, nous garantissons le plaisir en toute sécurité.",
    about_f1_title: "Passion de la Mer",
    about_f1_desc: "Nés de notre lien avec l\'océan et la côte de Setúbal.",
    about_f2_title: "Sécurité Totale",
    about_f2_desc: "Équipement certifié et briefing complet avant chaque sortie.",
    about_f3_title: "Expérience Unique",
    about_f3_desc: "Chaque sortie est conçue pour être inoubliable.",
    about_f4_title: "Adrénaline Pure",
    about_f4_desc: "Vitesse et liberté sur les eaux du Sado.",

    weather_tag: "Météo",
    weather_title: "Prévisions pour Setúbal",
    weather_desc: "Consultez les conditions météo avant de réserver votre expérience.",
    weather_s1_title: "Soleil",
    weather_s1_desc: "Les journées ensoleillées sont parfaites pour une aventure en mer.",
    weather_s2_title: "Vent",
    weather_s2_desc: "Le vent peut créer des conditions plus difficiles.",
    weather_s3_title: "Nuageux",
    weather_s3_desc: "Le temps nuageux n\'arrête pas le plaisir.",
    weather_s4_title: "Pluie",
    weather_s4_desc: "En cas de pluie, nous reporterons votre expérience.",
    weather_source: "Données fournies par l\'IPMA — Institut Portugais de la Mer et de l\'Atmosphère",
    weather_modal_temp: "Température",
    weather_modal_wind: "Vent",
    weather_modal_precipitation: "Précipitations",
    weather_modal_sea_state: "État de la Mer",
    weather_modal_sunrise: "Lever du Soleil",
    weather_modal_sunset: "Coucher du Soleil",

    exp_tag: "Expériences",
    exp_title: "Choisissez votre aventure",
    exp_desc: "De la balade rapide à l\'expérience coucher de soleil, nous avons le forfait parfait pour vous.",
    exp_tab_jetski: "Jet Ski",
    exp_tab_boats: "Bateaux",
    exp_tab_boats_soon: "Bateaux (Bientôt!)",
    exp_tab_extras: "Extras",
    exp_most_popular: "Le Plus Populaire",
    exp_book: "Réserver",
    exp_book_now: "Réserver maintenant",
    exp_view_details: "Voir les détails et les prix",
    exp_max_2: "Max. 2 personnes par jet ski",
    exp_photos_optional: "Pack Photos en option",
    exp_15min: "15 Minutes",
    exp_30min: "30 Minutes",
    exp_1hour: "1 Heure",
    exp_group: "Pack Groupe",
    exp_sunset: "Expérience Coucher de Soleil",
    exp_photos: "Pack Photos",
    exp_towable: "Bouée Tractée",
    exp_inc_1jetski: "1 jet ski",
    exp_inc_lifejacket: "Gilet de sauvetage",
    exp_inc_briefing: "Briefing de sécurité",
    exp_inc_insurance: "Assurance incluse",
    exp_inc_4jetski: "4 jet skis",
    exp_inc_1hour: "1 heure complète",
    exp_inc_guide: "Guide dédié",
    exp_inc_sunset_1h: "1 heure au coucher du soleil",
    exp_inc_arrabida: "Route d\'Arrábida",
    exp_inc_photos: "Photos de l\'expérience",
    exp_inc_15photos: "15 photos professionnelles",
    exp_inc_proediting: "Édition professionnelle",
    exp_inc_24h: "Livraison numérique en 24h",
    exp_inc_highres: "Haute résolution",
    exp_inc_towable_ride: "1 tour de bouée tractée",
    exp_inc_photos_included: "Pack Photos Inclus",
    boat_people: "personnes",
    boat_half_day: "Demi-journée (4h)",
    boat_full_day: "Journée complète (8h)",
    boat_inc_fuel: "Carburant inclus",
    boat_inc_lifejacket: "Gilets de sauvetage",
    boat_inc_briefing: "Briefing de sécurité",
    boat_inc_insurance: "Assurance incluse",
    boat_range_all: "Tout",
    boat_range_low: "Gamme Basse",
    boat_range_mid: "Gamme Moyenne",
    boat_range_high: "Gamme Haute",

    safety_tag: "Sécurité",
    safety_title: "Votre sécurité est notre priorité",
    safety_desc: "Du plaisir sans souci. Tout est pensé dans les moindres détails pour que vous en profitiez au maximum.",
    safety_s1_title: "Équipement de Sécurité",
    safety_s1_desc: "Gilets de sauvetage certifiés et disponibles pour tous les participants.",
    safety_s2_title: "Briefing Complet",
    safety_s2_desc: "Avant chaque sortie, notre équipe fournit un briefing de sécurité détaillé.",
    safety_s3_title: "Moniteurs Certifiés",
    safety_s3_desc: "Supervision constante par des moniteurs expérimentés et certifiés.",
    safety_s4_title: "Assurance Incluse",
    safety_s4_desc: "Toutes nos expériences incluent une assurance accidents personnels et responsabilité civile.",

    gallery_tag: "Galerie",
    gallery_title: "Des moments qui restent",
    gallery_cta: "Voir Tout",
    gallery_title_full: "Galerie Complète",
    gallery_desc_full: "Des moments inoubliables capturés lors de nos aventures.",

    test_tag: "Témoignages",
    test_title: "Ce que disent les aventuriers",
    test_r1_name: "Miguel Santos",
    test_r1_text: "Expérience incroyable ! L\'équipe était super professionnelle et la côte d\'Arrábida vue de la mer est extraordinaire. Déjà réservé pour l\'été prochain !",
    test_r2_name: "Ana Costa",
    test_r2_text: "L\'expérience coucher de soleil était magique. Adrénaline + coucher de soleil = perfection ! Je recommande à 100%.",
    test_r3_name: "Ricardo Lopes",
    test_r3_text: "Nous y sommes allés en groupe et c\'était le meilleur programme de l\'été. Organisation impeccable et beaucoup de plaisir. Top !",

    contact_tag: "Contact",
    contact_title: "Prêt pour l\'aventure ?",
    contact_desc: "Contactez-nous et réservez votre expérience maintenant.",
    contact_phone: "Téléphone",
    contact_whatsapp: "WhatsApp",
    contact_whatsapp_desc: "Envoyez-nous un message à tout moment",
    contact_email: "Email",
    contact_instagram: "Instagram",
    contact_hours: "Horaires",
    contact_hours_1: "Mai à Septembre : 9h – 20h",
    contact_location: "Localisation",
    contact_loc_1: "Avenida Jaime Rebelo 41",
    contact_loc_2: "2904-503 Setúbal",
    contact_form_name: "Nom",
    contact_form_name_ph: "Votre nom",
    contact_form_email: "Email",
    contact_form_message: "Message",
    contact_form_message_ph: "J\'aimerais réserver pour...",
    contact_form_send: "Envoyer le Message",

    faq_title: "Questions Fréquentes",
    faq_desc: "Tout ce que vous devez savoir avant votre expérience.",
    faq_q1: "Ai-je besoin d\'expérience pour piloter un jet ski ?",
    faq_a1: "Non ! Nous faisons un briefing complet avant chaque sortie. C\'est super facile et sûr.",
    faq_q2: "Quel est l\'âge minimum ?",
    faq_a2: "L\'âge minimum pour conduire est 16 ans. Les moins de 16 ans peuvent être passagers accompagnés d\'un adulte.",
    faq_q3: "Puis-je annuler ou reprogrammer ma réservation ?",
    faq_a3: "Oui, vous pouvez annuler ou reprogrammer jusqu\'à 24 heures avant l\'expérience sans frais.",
    faq_q4: "Que se passe-t-il en cas de mauvais temps ?",
    faq_a4: "En cas de conditions météo défavorables, nous vous contactons pour reprogrammer sans frais supplémentaires.",
    faq_q5: "L\'assurance est-elle incluse ?",
    faq_a5: "Oui, toutes les expériences incluent une assurance accidents et responsabilité civile.",
    faq_q6: "Puis-je emporter mon téléphone pendant l\'expérience ?",
    faq_a6: "Nous recommandons de laisser les objets de valeur à terre. Des casiers sont disponibles. Avec le Pack Photos, nous capturons les souvenirs pour vous !",
    faq_q7: "Faut-il un permis de conduire pour piloter un jet ski ?",
    faq_a7: "Non, aucun permis de conduire n\'est nécessaire pour piloter un jet ski lors de nos expériences. Toutes les activités sont encadrées par des moniteurs certifiés qui vous accompagnent tout au long du parcours. Avant chaque session, vous recevez un briefing complet sur les commandes et les règles de sécurité. Notre équipe veille à ce que vous vous sentiez à l\'aise et en sécurité, quelle que soit votre expérience. Il suffit d\'avoir envie de s\'amuser !",

    footer_rights: "Tous droits réservés.",
    footer_terms: "CGV",
    footer_privacy: "Confidentialité",

    book_title: "Réserver",
    book_step_date: "Date",
    book_step_time: "Heure",
    book_step_details: "Détails",
    book_step_confirm: "Confirmation",
    book_choose_day: "Choisissez le jour",
    book_choose_time: "Choisissez l\'heure",
    book_your_details: "Vos informations",
    book_location: "Lieu",
    book_name: "Nom",
    book_name_ph: "Votre nom",
    book_email: "Email",
    book_phone: "Téléphone",
    book_num_people: "Nombre de personnes",
    book_max_2_per_jet: "Max. 2 personnes par jet ski",
    book_max_capacity: "Capacité maximale",
    book_duration: "Durée",
    book_jetski_singular: "jet ski",
    book_jetski_plural: "jet skis",
    book_summary: "Résumé de la réservation",
    book_experience: "Expérience",
    book_price: "Prix",
    book_jetskis: "Jet skis",
    book_date: "Date",
    book_time: "Heure",
    book_people: "Personnes",
    book_accept_terms: "J\'ai lu et j\'accepte les",
    book_terms: "Conditions Générales",
    book_and: "et la",
    book_privacy: "Politique de Confidentialité",
    book_confirm: "Confirmer la Réservation",
    book_sending: "Envoi en cours...",
    book_success_title: "Réservation Envoyée !",
    book_success_desc: "Nous avons envoyé un email de confirmation à",
    book_back: "Retour",
    book_next: "Suivant",
    book_back_home: "Retour à l\'Accueil",
    book_pack_fotos_desc: "15 photos éditées professionnellement, livraison numérique en 24h",
    book_sent_toast: "Réservation envoyée !",
    book_sent_toast_desc: "Vous recevrez un email de confirmation bientôt.",
    book_error_toast: "Erreur d\'envoi",
    book_error_toast_desc: "Veuillez réessayer ou nous contacter directement.",
    book_catering: "Service de Traiteur",
    book_catering_desc: "Planche de fromages et charcuteries, snacks, boissons fraîches et fruits de saison.",
  },

  zh: {
    nav_home: "首页",
    nav_about: "关于我们",
    nav_experiences: "体验",
    nav_safety: "安全",
    nav_gallery: "画廊",
    nav_contacts: "联系方式",
    nav_affiliates: "🎁 合作伙伴",
    nav_book_now: "立即预订",

    hero_badge: "📍 塞图巴尔，葡萄牙",
    hero_title_1: "感受自由",
    hero_title_2: "萨杜河的召唤",
    hero_subtitle: "在塞图巴尔海岸体验我们难忘的航海探险之旅。",
    hero_cta_book: "立即预订",
    hero_cta_experiences: "查看体验",

    about_tag: "关于我们",
    about_title_1: "大海的能量",
    about_title_2: "尽在掌中",
    about_desc: "Royal Coast是一家年轻而充满活力的公司，致力于在塞图巴尔海岸提供纯粹自由的时刻。凭借先进的设备和充满热情的团队，我们确保安全与乐趣并存。",
    about_f1_title: "热爱大海",
    about_f1_desc: "源于我们与海洋和塞图巴尔海岸的深厚联系。",
    about_f2_title: "全面安全",
    about_f2_desc: "认证设备，每次出行前进行完整安全讲解。",
    about_f3_title: "独特体验",
    about_f3_desc: "每次旅程都经过精心设计，令人难忘。",
    about_f4_title: "纯粹肾上腺素",
    about_f4_desc: "在萨杜河水域享受速度与自由。",

    weather_tag: "天气",
    weather_title: "塞图巴尔天气预报",
    weather_desc: "预订体验前查看天气状况。",
    weather_s1_title: "晴",
    weather_s1_desc: "晴天是海上探险的绝佳日子。",
    weather_s2_title: "风",
    weather_s2_desc: "风可能会带来更具挑战性的条件。",
    weather_s3_title: "多云",
    weather_s3_desc: "多云天气不会影响乐趣。",
    weather_s4_title: "雨",
    weather_s4_desc: "如果下雨，我们将重新安排您的体验。",
    weather_source: "数据由IPMA提供 — 葡萄牙海洋与大气研究所",
    weather_modal_temp: "温度",
    weather_modal_wind: "风",
    weather_modal_precipitation: "降水",
    weather_modal_sea_state: "海况",
    weather_modal_sunrise: "日出",
    weather_modal_sunset: "日落",

    exp_tag: "体验",
    exp_title: "选择你的冒险",
    exp_desc: "从快速骑行到日落体验，我们为你准备了完美的套餐。",
    exp_tab_jetski: "水上摩托",
    exp_tab_boats: "船只",
    exp_tab_boats_soon: "船只 (敬请期待!)",
    exp_tab_extras: "附加项目",
    exp_most_popular: "最受欢迎",
    exp_book: "预订",
    exp_book_now: "立即预订",
    exp_view_details: "查看详情和价格",
    exp_max_2: "每辆摩托最多2人",
    exp_photos_optional: "可选摄影套餐",
    exp_15min: "15分钟",
    exp_30min: "30分钟",
    exp_1hour: "1小时",
    exp_group: "团体套餐",
    exp_sunset: "日落体验",
    exp_photos: "摄影套餐",
    exp_towable: "拖拽浮标",
    exp_inc_1jetski: "1辆水上摩托",
    exp_inc_lifejacket: "救生衣",
    exp_inc_briefing: "安全讲解",
    exp_inc_insurance: "包含保险",
    exp_inc_4jetski: "4辆水上摩托",
    exp_inc_1hour: "完整1小时",
    exp_inc_guide: "专属向导",
    exp_inc_sunset_1h: "日落时分1小时",
    exp_inc_arrabida: "阿拉比达路线",
    exp_inc_photos: "体验照片",
    exp_inc_15photos: "15张专业照片",
    exp_inc_proediting: "专业修图",
    exp_inc_24h: "24小时内数字交付",
    exp_inc_highres: "高分辨率",
    exp_inc_towable_ride: "1次拖拽浮标体验",
    exp_inc_photos_included: "包含照片包",
    boat_people: "人",
    boat_half_day: "半天 (4小时)",
    boat_full_day: "全天 (8小时)",
    boat_inc_fuel: "含燃油",
    boat_inc_lifejacket: "救生衣",
    boat_inc_briefing: "安全讲解",
    boat_inc_insurance: "含保险",
    boat_range_all: "全部",
    boat_range_low: "低端系列",
    boat_range_mid: "中端系列",
    boat_range_high: "高端系列",

    safety_tag: "安全",
    safety_title: "您的安全是我们的首要任务",
    safety_desc: "无忧的乐趣。我们精心考虑每一个细节，让您充分享受。",
    safety_s1_title: "安全设备",
    safety_s1_desc: "为所有参与者提供经过认证的救生衣。",
    safety_s2_title: "完整简报",
    safety_s2_desc: "每次出发前，我们的团队都会提供详细的安全简报。",
    safety_s3_title: "认证教练",
    safety_s3_desc: "由经验丰富且经过认证的教练持续监督。",
    safety_s4_title: "包含保险",
    safety_s4_desc: "我们所有的体验都包括人身意外伤害和责任保险。",

    gallery_tag: "画廊",
    gallery_title: "难忘的时刻",
    gallery_cta: "查看全部",
    gallery_title_full: "完整画廊",
    gallery_desc_full: "在我们探险中捕捉到的难忘时刻。",

    test_tag: "评价",
    test_title: "冒险者怎么说",
    test_r1_name: "Miguel Santos",
    test_r1_text: "不可思议的体验！团队非常专业，从海上看阿拉比达海岸美得令人窒息。已经预订了明年夏天！",
    test_r2_name: "Ana Costa",
    test_r2_text: "日落体验太神奇了。肾上腺素+日落=完美！100%推荐。",
    test_r3_name: "Ricardo Lopes",
    test_r3_text: "我们团体去的，这是今年夏天最棒的活动。组织完美，充满乐趣。太棒了！",

    contact_tag: "联系方式",
    contact_title: "准备好冒险了吗？",
    contact_desc: "联系我们，立即预订你的体验。",
    contact_phone: "电话",
    contact_whatsapp: "WhatsApp",
    contact_whatsapp_desc: "随时给我们发消息",
    contact_email: "邮箱",
    contact_instagram: "Instagram",
    contact_hours: "营业时间",
    contact_hours_1: "5月至9月：上午9点至晚上8点",
    contact_location: "位置",
    contact_loc_1: "Avenida Jaime Rebelo 41",
    contact_loc_2: "2904-503 Setúbal",
    contact_form_name: "姓名",
    contact_form_name_ph: "你的名字",
    contact_form_email: "邮箱",
    contact_form_message: "留言",
    contact_form_message_ph: "我想预订...",
    contact_form_send: "发送消息",

    faq_title: "常见问题",
    faq_desc: "体验前你需要知道的一切。",
    faq_q1: "我需要经验才能驾驶水上摩托吗？",
    faq_a1: "不需要！每次出发前我们都会进行完整的安全讲解。非常简单和安全。",
    faq_q2: "最低年龄是多少？",
    faq_a2: "驾驶最低年龄为16岁。16岁以下可以作为乘客由成人陪同。",
    faq_q3: "我可以取消或改期预订吗？",
    faq_a3: "可以，您可以在体验前24小时免费取消或改期。",
    faq_q4: "天气不好怎么办？",
    faq_a4: "如遇恶劣天气，我们会联系您免费改期。",
    faq_q5: "包含保险吗？",
    faq_a5: "是的，所有体验都包含人身意外和责任保险。",
    faq_q6: "体验期间可以带手机吗？",
    faq_a6: "我们建议将贵重物品留在岸上。有储物柜可用。选择摄影套餐，我们为您记录美好回忆！",
    faq_q7: "驾驶水上摩托需要驾照吗？",
    faq_a7: "不需要，在我们的体验活动中驾驶水上摩托不需要驾照。所有活动都由持证教练全程陪同和监督。每次出发前，您将接受完整的操作和安全规则讲解。无论您是否有相关经验，我们的团队都会确保您感到舒适和安全。您只需要带上享受乐趣的心情！",

    footer_rights: "版权所有。",
    footer_terms: "条款",
    footer_privacy: "隐私",

    book_title: "预订",
    book_step_date: "日期",
    book_step_time: "时间",
    book_step_details: "详情",
    book_step_confirm: "确认",
    book_choose_day: "选择日期",
    book_choose_time: "选择时间",
    book_your_details: "你的信息",
    book_location: "位置",
    book_name: "姓名",
    book_name_ph: "你的名字",
    book_email: "邮箱",
    book_phone: "电话",
    book_num_people: "人数",
    book_max_2_per_jet: "每辆摩托最多2人",
    book_max_capacity: "最大容量",
    book_duration: "时长",
    book_jetski_singular: "辆摩托",
    book_jetski_plural: "辆摩托",
    book_summary: "预订摘要",
    book_experience: "体验",
    book_price: "价格",
    book_jetskis: "水上摩托",
    book_date: "日期",
    book_time: "时间",
    book_people: "人数",
    book_accept_terms: "我已阅读并接受",
    book_terms: "条款与条件",
    book_and: "和",
    book_privacy: "隐私政策",
    book_confirm: "确认预订",
    book_sending: "发送中...",
    book_success_title: "预订已发送！",
    book_success_desc: "我们已发送确认邮件至",
    book_back: "返回",
    book_next: "下一步",
    book_back_home: "返回首页",
    book_pack_fotos_desc: "15张专业编辑照片，24小时内数字交付",
    book_sent_toast: "预订已发送！",
    book_sent_toast_desc: "你将很快收到确认邮件。",
    book_error_toast: "发送失败",
    book_error_toast_desc: "请重试或直接联系我们。",
    book_catering: "餐饮服务",
    book_catering_desc: "奶酪和熟食拼盘、小吃、冷饮和时令水果。",
  },
};
