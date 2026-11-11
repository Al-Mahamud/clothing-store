-- Catalog: categories, collections, products with colours, images and size variants.
-- Prices are whole taka.

create table categories (
    id          bigint generated always as identity primary key,
    parent_id   bigint references categories (id),
    name        text    not null,
    slug        text    not null unique,
    description text,
    image_url   text,
    position    integer not null default 0
);
create index categories_parent on categories (parent_id);

create table collections (
    id          bigint generated always as identity primary key,
    name        text    not null,
    slug        text    not null unique,
    tagline     text,
    description text,
    image_url   text,
    position    integer not null default 0,
    active      boolean not null default true
);

create table products (
    id               bigint generated always as identity primary key,
    name             text        not null,
    slug             text        not null unique,
    category_id      bigint      not null references categories (id),
    description      text        not null default '',
    details          text        not null default '',  -- one bullet per line
    fabric           text,
    care             text,
    fit              text,
    size_chart       text        not null default 'NONE'
        check (size_chart in ('NONE', 'TOPS', 'BOTTOMS', 'KIDS')),
    price            integer     not null check (price > 0),
    compare_at_price integer check (compare_at_price is null or compare_at_price > price),
    status           text        not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    featured         boolean     not null default false,
    sold_count       integer     not null default 0,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    search           tsvector generated always as (
        setweight(to_tsvector('simple', name), 'A') ||
        setweight(to_tsvector('simple', coalesce(fabric, '')), 'B') ||
        setweight(to_tsvector('simple', description), 'C')) stored
);
create index products_category on products (category_id);
create index products_status_created on products (status, created_at desc);
create index products_search on products using gin (search);

create table product_collections (
    product_id    bigint not null references products (id) on delete cascade,
    collection_id bigint not null references collections (id) on delete cascade,
    primary key (product_id, collection_id)
);
create index product_collections_collection on product_collections (collection_id);

-- family groups shades for filtering: "Bottle green" and "Olive" are both Green.
create table product_colors (
    id         bigint generated always as identity primary key,
    product_id bigint  not null references products (id) on delete cascade,
    name       text    not null,
    hex        text    not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
    family     text    not null,
    position   integer not null default 0,
    unique (product_id, name)
);

create table product_images (
    id         bigint generated always as identity primary key,
    product_id bigint  not null references products (id) on delete cascade,
    color_id   bigint references product_colors (id) on delete cascade,
    url        text    not null,
    alt        text    not null default '',
    position   integer not null default 0
);
create index product_images_product on product_images (product_id, position);

create table variants (
    id         bigint generated always as identity primary key,
    product_id bigint  not null references products (id) on delete cascade,
    color_id   bigint  not null references product_colors (id) on delete cascade,
    size       text    not null,
    position   integer not null default 0,  -- size order: S before M before L
    sku        text    not null unique,
    stock      integer not null default 0 check (stock >= 0),
    unique (product_id, color_id, size)
);
create index variants_product on variants (product_id);
