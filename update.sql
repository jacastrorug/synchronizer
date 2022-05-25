ALTER TABLE store_mazko.mantenimiento
ADD id_dns INT(128) NULL;

ALTER TABLE store_mazko.mantenimiento MODIFY COLUMN id int(5) auto_increment NOT NULL;
