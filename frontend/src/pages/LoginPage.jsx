import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import heroImage from "../assets/signup.jpeg";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { login, isLoggingIn } = useAuthStore();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await login({
      ...formData,
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#ffffff_0%,#f2f7fc_48%,#e9f2fa_100%)] px-4 py-10 text-[#0a315c] sm:px-6 lg:py-14">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <Leaf className="size-8 fill-[#b7cf62] text-[#b7cf62]" />
            </div>

            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#073665] sm:text-5xl">
              ClearView Blog
            </h1>
          </div>

          <div className="mt-5 flex items-center justify-center gap-5">
            <span className="h-px w-12 bg-[#b7cf62]" />

            <p className="text-sm tracking-wide text-slate-500 sm:text-base">
              Inspiring clarity. Every view.
            </p>

            <span className="h-px w-12 bg-[#b7cf62]" />
          </div>
        </header>

        {/* Login card */}
        <section className="grid overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_70px_rgba(29,65,105,0.18)] lg:grid-cols-[0.8fr_1.2fr]">
          {/* Image */}
          <aside className="relative hidden min-h-[680px] overflow-hidden lg:block">
            <img
              src={heroImage}
              alt="Mountain lake landscape"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-[#d6e9fc]/80 via-transparent to-[#062f56]/20" />

            <div className="relative z-10 max-w-xs p-14">
              <p className="font-serif text-2xl leading-relaxed text-[#0a3763]">
                The clearest views come from open minds and curious hearts.
              </p>

              <div className="mt-7 flex items-center gap-4">
                <Leaf className="size-5 fill-[#b7cf62] text-[#b7cf62]" />
                <span className="h-px w-14 bg-[#b7cf62]" />
              </div>
            </div>
          </aside>

          {/* Form */}
          <div className="flex items-center px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-10">
                <h2 className="font-serif text-4xl font-bold text-[#0a3763] sm:text-5xl">
                  Welcome Back
                </h2>

                <p className="mt-3 text-lg text-slate-500">
                  Log in to continue your journey.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block font-semibold text-[#0a3763]"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-16 w-full rounded-xl border border-slate-300 bg-white pl-14 pr-5 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block font-semibold text-[#0a3763]"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="h-16 w-full rounded-xl border border-slate-300 bg-white pl-14 pr-14 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((currentValue) => !currentValue)
                      }
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#0b4f88]"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#0b5592] to-[#073665] text-lg font-semibold text-white shadow-lg shadow-[#0b4f88]/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </button>
              </form>

              {/* Signup link */}
              <div className="mt-10 flex items-center gap-5">
                <span className="h-px flex-1 bg-slate-200" />

                <p className="text-center text-sm text-slate-500">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-[#9caf49] transition hover:text-[#7f9236]"
                  >
                    Create an account
                  </Link>
                </p>

                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;