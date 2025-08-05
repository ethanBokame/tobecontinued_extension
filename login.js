

// Ajout du style pour l'animation de chargement
const style = document.createElement("style");
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
    const content = document.querySelector(".content");
    content.style.opacity = "0";
    content.style.transform = "translateY(20px)";

    setTimeout(() => {
        content.style.transition = "all 0.6s ease";
        content.style.opacity = "1";
        content.style.transform = "translateY(0)";
    }, 200);

    // Vérifier le statut d'authentification au chargement
    checkAuthStatus();

    // Ajouter l'event listener pour le bouton de connexion
    const connectButton = document.querySelector(".connect-button");
    if (connectButton) {
        connectButton.addEventListener("click", connectWithGoogle);
    }
});

// Écouter les changements d'état d'authentification
supabase.auth.onAuthStateChange((event, session) => {
    console.log("État d'authentification changé:", event, session);

    if (event === "SIGNED_IN" && session) {
        showLoggedInState(session.user);
    } else if (event === "SIGNED_OUT") {
        location.reload();
    }
});

async function connectWithGoogle() {
    const button = document.querySelector(".connect-button");
    const buttonText = button.innerHTML;

    try {
        // Animation du bouton et état de chargement
        button.style.transform = "scale(0.95)";
        button.innerHTML =
            '<div style="width: 18px; height: 18px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div> Connexion...';
        button.disabled = true;

        // Connexion avec Google via Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                // redirectTo: chrome.identity.getRedirectURL(), // Pour extensions Chrome
                // queryParams: {
                //     access_type: "offline",
                //     prompt: "consent",
                // },
            },
        });

        if (error) {
            throw error;
        }

        // Succès de la connexion
        console.log("Connexion réussie:", data);

        // Fermer la popup et rediriger vers l'app
        setTimeout(() => {
            window.close();
        }, 1000);
    } catch (error) {
        console.error("Erreur de connexion:", error);

        // Afficher l'erreur à l'utilisateur
        button.innerHTML = "❌ Erreur de connexion";
        button.style.background = "#dc3545";

        setTimeout(() => {
            button.innerHTML = buttonText;
            button.style.background = "#009FFD";
            button.style.transform = "scale(1)";
            button.disabled = false;
        }, 3000);
    }
}

// Vérifier si l'utilisateur est déjà connecté
async function checkAuthStatus() {
    try {
        const {
            data: { session },
            error,
        } = await supabase.auth.getSession();

        if (error) {
            console.error("Erreur lors de la vérification de session:", error);
            return;
        }

        if (session) {
            // L'utilisateur est déjà connecté
            showLoggedInState(session.user);
        }
    } catch (error) {
        console.error(
            "Erreur lors de la vérification d'authentification:",
            error
        );
    }
}

// Afficher l'état connecté
function showLoggedInState(user) {
    const content = document.querySelector(".content");
    content.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: #009FFD; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                        ${
                            user.user_metadata?.name
                                ? user.user_metadata.name
                                      .charAt(0)
                                      .toUpperCase()
                                : "👤"
                        }
                    </div>
                    <div>
                        <div style="color: #495057; font-size: 16px; font-weight: 500; margin-bottom: 5px;">
                            Connecté en tant que
                        </div>
                        <div style="color: #009FFD; font-size: 14px; font-weight: 500;">
                            ${user.user_metadata?.name || user.email}
                        </div>
                    </div>
                    <button onclick="logout()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-size: 12px; cursor: pointer; transition: all 0.3s ease;">
                        Se déconnecter
                    </button>
                    <div style="margin-top: 10px;">
                        <div style="color: #28a745; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                            <span style="width: 8px; height: 8px; background: #28a745; border-radius: 50%;"></span>
                            Extension synchronisée
                        </div>
                    </div>
                </div>
            `;
}

// Déconnexion
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Recharger la popup pour revenir à l'état initial
        location.reload();
    } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
    }
}
