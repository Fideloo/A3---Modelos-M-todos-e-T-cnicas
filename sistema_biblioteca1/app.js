const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const app = express();

// Configuração do body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração do EJS para as views
app.set("view engine", "ejs");
app.use(express.static("public"));

// Configuração do banco de dados
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "biblioteca1",
});

db.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err);
    } else {
        console.log("Conectado ao banco de dados.");
    }
});

// Rota de login
app.get("/", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    const { email, senha } = req.body;
    db.query(
        "SELECT * FROM usuarios WHERE email = ? AND senha = ?",
        [email, senha],
        (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                res.redirect("/dashboard");
            } else {
                res.send("Credenciais inválidas! Tente novamente.");
            }
        }
    );
});

// Rota para o dashboard
app.get("/dashboard", (req, res) => {
    res.render("dashboard");
});

// Rotas para gerenciar livros
app.get("/livros", (req, res) => {
    db.query("SELECT * FROM livros", (err, results) => {
        if (err) throw err;
        res.render("livros", { livros: results });
    });
});

app.post("/livros", (req, res) => {
    const { titulo, autor, ano, genero } = req.body;
    db.query(
        "INSERT INTO livros (titulo, autor, ano, genero) VALUES (?, ?, ?, ?)",
        [titulo, autor, ano, genero],
        (err) => {
            if (err) throw err;
            res.redirect("/livros");
        }
    );
});

app.post("/livros/deletar/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM livros WHERE id = ?", [id], (err) => {
        if (err) throw err;
        res.redirect("/livros");
    });
});

app.get("/livros/editar/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM livros WHERE id = ?", [id], (err, results) => {
        if (err) throw err;
        res.render("editarLivro", { livro: results[0] });
    });
});

app.post("/livros/editar/:id", (req, res) => {
    const { id } = req.params;
    const { titulo, autor, ano, genero } = req.body;
    db.query(
        "UPDATE livros SET titulo = ?, autor = ?, ano = ?, genero = ? WHERE id = ?",
        [titulo, autor, ano, genero, id],
        (err) => {
            if (err) throw err;
            res.redirect("/livros");
        }
    );
});

// Rotas para gerenciar clientes
app.get("/clientes", (req, res) => {
    db.query("SELECT * FROM clientes", (err, results) => {
        if (err) throw err;
        res.render("clientes", { clientes: results });
    });
});

app.post("/clientes", (req, res) => {
    const { nome, cpf, endereco, telefone } = req.body;
    db.query(
        "INSERT INTO clientes (nome, cpf, endereco, telefone) VALUES (?, ?, ?, ?)",
        [nome, cpf, endereco, telefone],
        (err) => {
            if (err) throw err;
            res.redirect("/clientes");
        }
    );
});

app.post("/clientes/deletar/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM clientes WHERE id = ?", [id], (err) => {
        if (err) throw err;
        res.redirect("/clientes");
    });
});

app.get("/clientes/editar/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM clientes WHERE id = ?", [id], (err, results) => {
        if (err) throw err;
        res.render("editarCliente", { cliente: results[0] });
    });
});

app.post("/clientes/editar/:id", (req, res) => {
    const { id } = req.params;
    const { nome, cpf, endereco, telefone } = req.body;
    db.query(
        "UPDATE clientes SET nome = ?, cpf = ?, endereco = ?, telefone = ? WHERE id = ?",
        [nome, cpf, endereco, telefone, id],
        (err) => {
            if (err) throw err;
            res.redirect("/clientes");
        }
    );
});

// Rotas para gerenciar empréstimos
app.get("/emprestimos", (req, res) => {
    const query = `
        SELECT 
            emprestimos.id, 
            livros.titulo AS livro, 
            clientes.nome AS cliente, 
            emprestimos.data_emprestimo, 
            emprestimos.data_devolucao 
        FROM emprestimos
        JOIN livros ON emprestimos.livro_id = livros.id
        JOIN clientes ON emprestimos.cliente_id = clientes.id
    `;
    db.query(query, (err, results) => {
        if (err) throw err;
        res.render("emprestimos", { emprestimos: results });
    });
});

app.get("/emprestimos/novo", (req, res) => {
    db.query("SELECT * FROM livros", (err, livros) => {
        if (err) throw err;
        db.query("SELECT * FROM clientes", (err, clientes) => {
            if (err) throw err;
            res.render("novoEmprestimo", { livros, clientes });
        });
    });
});

app.post("/emprestimos", (req, res) => {
    const { livro_id, cliente_id, data_emprestimo, data_devolucao } = req.body;

    // Verificar disponibilidade do livro
    const checkAvailabilityQuery = `
        SELECT * FROM emprestimos 
        WHERE livro_id = ? AND data_devolucao > NOW()
    `;
    db.query(checkAvailabilityQuery, [livro_id], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            res.send("O livro já está emprestado e não está disponível.");
        } else {
            const insertQuery = `
                INSERT INTO emprestimos (livro_id, cliente_id, data_emprestimo, data_devolucao) 
                VALUES (?, ?, ?, ?)
            `;
            db.query(
                insertQuery,
                [livro_id, cliente_id, data_emprestimo, data_devolucao],
                (err) => {
                    if (err) throw err;
                    res.redirect("/emprestimos");
                }
            );
        }
    });
});

// Porta do servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
