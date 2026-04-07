import { deleteShortLink } from "../Services/Shortener.services.js"

export const deleteHandler = async (req, res) => {
  // console.log("Delete request received for shortcode:", req.params.shortcode);
  try {
    await deleteShortLink(req.params.shortcode);
    // console.log("Deleted successfully");
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    // console.error("Delete error:", err);
    res.status(500).json({ message: "Error deleting" });
  }
}; 
