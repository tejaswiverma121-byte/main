const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "shhh";

// ── Protect any route that requires a logged-in user ──────────────────────────
function isLoggedIn(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token || token === "") return res.render("notloggedin");
        let data = jwt.verify(token, JWT_SECRET);
        req.userinfo = data;
        next();
    } catch (err) {
        return res.render("notloggedin"); // invalid / expired token
    }
}

// ── Protect any route that requires admin role ─────────────────────────────────
function isAdmin(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token || token === "") return res.redirect("/admin/login");
        let data = jwt.verify(token, JWT_SECRET);
        if (data.role !== "admin") return res.redirect("/admin/login");
        req.userinfo = data;
        next();
    } catch (err) {
        return res.redirect("/admin/login");
    }
}

// ── Redirect already-logged-in users away from auth pages ─────────────────────
function redirectIfLoggedIn(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token || token === "") return next(); // not logged in — show the page

        const data = jwt.verify(token, JWT_SECRET);
        const dashboardUrl = data.role === "student"    ? "/dashboard/student"    :
                             data.role === "instructor" ? "/dashboard/instructor" :
                                                          "/dashboard/admin";

        // Homepage → silent redirect to dashboard
        if (req.path === "/") return res.redirect(dashboardUrl);

        // Login / Create pages → show friendly "already logged in" page
        res.set("Cache-Control", "no-store");
        return res.render("alreadyloggedin", { role: data.role, dashboardUrl });

    } catch (err) {
        next(); // bad/expired token — let them see the auth page
    }
}

module.exports = { isLoggedIn, isAdmin, redirectIfLoggedIn };
