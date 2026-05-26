import { Router } from 'express';
import { shortenUrl } from '../controllers/url.contoller';



const router = Router();

router.route('/shorten').post(shortenUrl);
router.route('/:shortCode').get(redirection);

