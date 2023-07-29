const jwt = require('jsonwebtoken')

module.exports = function(req, res, next) {
    try {
        let token = req.header('x-token')
        if(!token) {
            return res.status(400).send('Token Not Found. Please Login')
        }
        let decoded = jwt.verify(token,'jwtPassword')
        
        req.userdetails = decoded.userdetails
        // console.log("Decoded: ",decoded.userdetails.id)
        next()
    } catch(err) {
        console.log(err)
        return res.status(400).send('Authentication Error')
    }
}