const User = require('../models/user');

// Devolve a lista de Users
module.exports.list = () => {
    return User.find()
        .sort('name')
        .then(resposta => resposta)
        .catch(erro => erro);
};

module.exports.getUser = id => {
    return User.findById({ _id: id })
        .then(resposta => resposta)
        .catch(erro => erro);
};

module.exports.getUserbyEmail = function(email, callback) {
    User.findOne({email: email}).exec()
        .then(user => callback(null, user))
        .catch(err => callback(err));
}

module.exports.addUser = u => {
    return User.create(u)
        .then(resposta => resposta)
        .catch(erro => erro);
};

module.exports.updateUser = (id, info) => {
    return User.updateOne({ _id: id }, info)
        .then(resposta => resposta)
        .catch(erro => erro);
};

module.exports.updateUserStatus = (id, status) => {
    return User.updateOne({ _id: id }, { active: status })
        .then(resposta => resposta)
        .catch(erro => erro);
};

module.exports.updateUserPassword = (id, pwd) => {
    return User.updateOne({ _id: id }, pwd)
        .then(resposta => resposta)
        .catch(erro => erro);
};

module.exports.deleteUser = id => {
    return User.deleteOne({ _id: id })
        .then(resposta => resposta)
        .catch(erro => erro);
};
