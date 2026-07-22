import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/useAuthStore";
import heroImage from "../assets/signup.jpeg";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }

    if (!formData.password) {
      toast.error("Password is required");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    await signup(formData);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f2f7fc_45%,#eaf2fa_100%)] px-4 py-10 text-[#0b315c] sm:px-6 lg:py-14">
      <div className="mx-auto w-full max-w-6xl">
        {/* Brand */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <Leaf className="size-8 fill-[#b6cf63] text-[#b6cf63]" />
            </div>

            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#073665] sm:text-5xl">
              ClearView Blog
            </h1>
          </div>

          <div className="mt-5 flex items-center justify-center gap-5">
            <span className="h-px w-12 bg-[#b6cf63]" />
            <p className="text-sm tracking-wide text-slate-500 sm:text-base">
              Inspiring clarity. Every view.
            </p>
            <span className="h-px w-12 bg-[#b6cf63]" />
          </div>
        </header>

        {/* Registration card */}
        <section className="grid overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_70px_rgba(29,65,105,0.18)] lg:grid-cols-[0.85fr_1.15fr]">
          {/* Image panel */}
          <aside className="relative hidden min-h-[700px] overflow-hidden lg:block">
            <img
              src={heroImage}
              alt="Mountain landscape beside a clear lake"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-[#d8eaff]/80 via-transparent to-[#072f58]/20" />

            <div className="relative z-10 max-w-xs p-14">
              <p className="font-serif text-2xl leading-relaxed text-[#0a3763]">
                The clearest views come from open minds and curious hearts.
              </p>

              <div className="mt-7 flex items-center gap-4">
                <Leaf className="size-5 fill-[#b6cf63] text-[#b6cf63]" />
                <span className="h-px w-14 bg-[#b6cf63]" />
              </div>
            </div>
          </aside>

          {/* Form panel */}
          <div className="flex items-center px-6 py-10 sm:px-10 lg:px-16 lg:py-14">
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-9">
                <h2 className="font-serif text-4xl font-bold text-[#0a3763]">
                  Create Your Account
                </h2>

                <p className="mt-2 text-lg text-slate-500">
                  Join the community and begin sharing your perspective.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block font-semibold text-[#0a3763]"
                  >
                    Full name
                  </label>

                  <div className="relative">
                    <User className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                      className="h-16 w-full rounded-xl border border-slate-300 bg-white pl-14 pr-5 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
                    />
                  </div>
                </div>

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
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
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
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="h-16 w-full rounded-xl border border-slate-300 bg-white pl-14 pr-14 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
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

                <button
                  type="submit"
                  disabled={isSigningUp}
                  className="flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#0b5592] to-[#073665] text-lg font-semibold text-white shadow-lg shadow-[#0b4f88]/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningUp ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <div className="mt-9 flex items-center gap-5">
                <span className="h-px flex-1 bg-slate-200" />

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#9cb447] transition hover:text-[#7f9830]"
                  >
                    Log in
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

export default SignUpPage;