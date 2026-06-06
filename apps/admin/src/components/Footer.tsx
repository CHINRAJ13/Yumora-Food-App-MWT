import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <footer className="border-t border-border bg-card">
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
                    <div className="md:col-span-2 flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                                <span className="text-primary-foreground font-black text-lg">Y</span>
                            </div>
                            <span className="font-extrabold text-xl gradient-text">Yumora</span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed flex flex-col items-center md:items-start">
                            Coimbatore's premium food delivery platform. From traditional South Indian to Continental — we deliver happiness, one meal at a time.
                        </p>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <h4 className="font-bold text-foreground mb-3 text-sm">Quick Links</h4>
                        <div className="space-y-2 flex flex-col items-center md:items-start">
                            {[
                                { to: "/", label: "Home" },
                                { to: "/restaurants", label: "Restaurants" },
                                { to: "/offers", label: "Offers" },
                                { to: "/orders", label: "My Orders" },
                            ].map((l) => (
                                <Link key={l.to} to={l.to} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                    {l.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <h4 className="font-bold text-foreground mb-3 text-sm">Contact</h4>
                        <div className="space-y-2 text-sm text-muted-foreground flex flex-col items-center md:items-start">
                            <p>📍 Coimbatore, Tamil Nadu</p>
                            <p>📞 +91 98765 43210</p>
                            <p>✉️ hello@yumora.com</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <p className="text-xs text-muted-foreground w-full md:w-auto">© 2026 KovaiCrave Pro. All rights reserved.</p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span className="hover:text-primary cursor-pointer transition-colors hidden sm:inline">Privacy Policy</span>
                        <span className="hover:text-primary cursor-pointer transition-colors hidden sm:inline">Terms of Service</span>
                        <span className="hover:text-primary cursor-pointer transition-colors hidden sm:inline">Refund Policy</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer