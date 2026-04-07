import { LoadShortLink } from '../Services/Shortener.services.js'



export const redirecter = async (req, res) => {
    try {
        const { shortcode } = req.params
        const links = await LoadShortLink(shortcode)
        if (links) {
            res.redirect(links.originalUrl)
        } else {
            res.status(404).send("Shortcode not found")
        }
    } catch (err) {
        res.status(500).send("Internal Server Error")
    }
}
