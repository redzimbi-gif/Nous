-- Réponses aux messages : un message peut citer un autre message de la conversation.
-- Ajout facultatif et sans effet sur l'existant ; si le message cité est supprimé,
-- la réponse reste (reply_to repasse à NULL).
alter table public.messages
  add column if not exists reply_to uuid references public.messages(id) on delete set null;
