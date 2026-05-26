
# Functional Requirements:-

    Long URL - user enter

    short URL - output

  # Click On short URL - redirect to original Long url

    alias - [tail]

    analytics - Dashboard

# User Profile -

    URL Expiry (Default - infinity , userDefined )

# Non - functional Requirements :-

    always UP

    fast (read / write) Max - 100ms

    scale - 1M+ daily

    size of short url and tail size

# HLD :-

    Backend - JS

    Frontend - Application

    DB (fast) alias constraints indexing

    Caching - Redis [shortUrl,LongUrl]

    AWS -

    DB Scaling

# LLD :-

    short url generate ? / alias / Tail

    Random (a-z,A-Z,0-9) (6 digit)

    ## Collision -

    2 MD5 / SHA :- generate a non-repeating long hash , take starting/random 6 length

    3.count+base62 :- count - counter , base62 (a-z,A-Z,0.9) mix counter will not repeat

# api Design

    POST - api/short (take long url from user) and tail (optional)

        response (short URL)

    GET - /:shortUrl 

        ( redirect to original long link)

    Auth :-

        auth/signup

        auth/signin

        auth/logout

# DB Design :-

    URL mapping: -

        id :- BigInt

        short_tail:- varchar

        long_url :- text

        user_id:- defaut(null)

        click_count:- 0 ,increment++

        expirytime:-

        created time:-

# Capacity Estimation :-

    10M+ URL / Month -> short => 3lakh/day

    storage -> 1 URL 500Byte+100Byte MetaData

        600B*10M = 6GB / month

        1year= 6*12=72 GB

    5lakh/day -> req Server

        500000/(24*60*60)=5.787 req/sec

# caching Strategy:- (redis)

    100click/hour + cache TTL -> 12Hrs

    initially when made -> cache -> 24hrs TTL

    Format -> tail : longUrl

# Scaling the System

    horizontal scale ->

        3-5lakh/day Url short -> 20-30lakh Users/day

        take servers / 10lakh users
        scale according to utilization/traffic (ELB/nginx)

# DB Scaling ->

    2 DBs (consistency, partitioning)

    (primary) PDB (write)
                ⇵ sync
    (replica) RDB (read)

Sharding : - breaking a large dataset into smaller, horizontal pieces to be distributed across multiple independent servers. While similar to standard horizontal partitioning, sharding is distinct because it spreads information across separate database instances rather than keeping it on a single machine. This architecture, often described as shared-nothing, enhances performance and storage capacity by allowing for parallel processing and reduced index sizes

        RDB -> (a-f)tails R1

        -> (g-n) R2

        -> (o-z) R3

        -> (0-9) R4

    HotKeys : cache (CDN)

# rate limiting:-

    token bucket -> per User fixed tokens / per day

    leaky bucket -> give a token after fixed time

# Security:-

    url validation

    rate limiting

    captcha

    phising URL blocks 

# Analytics :-

    User -> otp , email, email , name

    clickCount , location , device , shareId

    this data -> kafka (asynchronously write operation in bunches) -> DashBoard -> anlytics -> DB

# Failure Handling ->

    (db fail) - Fallback Db

    (service fail ) - autoscaling , and Load balancer