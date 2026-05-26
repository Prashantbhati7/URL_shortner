import { asyncHandler } from "../utils/asynHandler"

const BASE62="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const codeLength = 6;
const shortenUrl = asyncHandler(async(req,res)=>{
    const originUrl = req.body.url;
    const shortcode =   await createShortUrl(codeLength);
    await db.query("INSERT INTO urls (original_url, short_code) VALUES (?, ?)", [originUrl, shortcode]);
    return {shortUrl:"https://bit.ly/"+shortcode};
})

const createShortUrl = asyncHandler(async(counter)=>{
    
    let shortcode="";
    while(counter>0){
        const remainder = (int)(counter%62);
        shortcode = shortcode+BASE62[remainder];
        counter = (int)(counter/62);
    }
    return shortcode.reverse().toString();
})

const redirection = asyncHandler(async(req,res)=>{
    const shortCode = req.params.shortCode;
    const url = await db.query("SELECT original_url FROM urls WHERE short_code = ?", [shortCode]);
    if(!url){
        return res.status(404).json({message:"Url not found"});
    }
    return res.redirect(url.original_url);
})

export {shortenUrl,redirection}