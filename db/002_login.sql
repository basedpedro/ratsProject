-- Login fica na própria pessoa: quem é da equipe pode receber acesso.
-- Quem não tem senha continua existindo como pessoa do time, só não entra.

alter table people add column password_hash text;

create unique index people_email_unique
  on people (lower(email))
  where btrim(email) <> '';
