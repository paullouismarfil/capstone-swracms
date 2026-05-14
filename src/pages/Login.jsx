import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Recycle,
  Landmark,
  Home,
  Truck,
  ClipboardCheck,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  Leaf,
  ChevronRight,
  X,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    {
      title: "LGU Admin",
      role: "lgu_admin",
      icon: <Landmark size={28} />,
      desc: "Manage reports, schedules, analytics, and system settings.",
      color: "green",
    },
    {
      title: "Barangay User",
      role: "barangay_user",
      icon: <Home size={28} />,
      desc: "Submit collection requests, track status, and view schedules.",
      color: "blue",
    },
    {
      title: "Collection Staff",
      role: "collection_staff",
      icon: <Truck size={30} />,
      desc: "View assigned routes, update status, and record collected waste.",
      color: "orange",
    },
  ];

  const colors = {
    green: {
      border: "border-green-500",
      bg: "bg-green-50/90",
      icon: "bg-green-700",
      text: "text-green-700",
    },
    blue: {
      border: "border-blue-400",
      bg: "bg-blue-50/90",
      icon: "bg-blue-700",
      text: "text-blue-700",
    },
    orange: {
      border: "border-orange-400",
      bg: "bg-orange-50/90",
      icon: "bg-orange-500",
      text: "text-orange-500",
    },
  };

  useEffect(() => {
    checkOAuthSession();
  }, []);

  async function checkOAuthSession() {
    const pendingRole = localStorage.getItem("pendingRole");

    if (!pendingRole) return;

    const { data } = await supabase.auth.getSession();

    if (data?.session?.user) {
      await verifyUser(data.session.user.email, pendingRole);
    }
  }

  function openLogin(role) {
    setSelectedRole(role);
    setError("");
    setEmail("");
    setPassword("");
  }

  function closeLogin() {
    setSelectedRole(null);
    setError("");
  }

  function goToPortal(role) {
    if (role === "lgu_admin") navigate("/lgu");
    if (role === "barangay_user") navigate("/barangay");
    if (role === "collection_staff") navigate("/collector");
  }

  async function verifyUser(userEmail, requiredRole) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", userEmail)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      setError("This account is not registered in the system.");
      return;
    }

    if (profile.status !== "active") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      setError("Your account is not yet approved by the LGU Admin.");
      return;
    }

    if (profile.role !== requiredRole) {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      setError("This account is not allowed for the selected role.");
      return;
    }

    localStorage.removeItem("pendingRole");
    goToPortal(profile.role);
  }

  async function handleEmailLogin() {
    try {
      setLoading(true);
      setError("");

      if (!selectedRole) {
        setError("Please select a role first.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      await verifyUser(data.user.email, selectedRole.role);
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider) {
    if (!selectedRole) {
      setError("Please select a role first.");
      return;
    }

    localStorage.setItem("pendingRole", selectedRole.role);

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-4 overflow-hidden relative"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.22), rgba(255,255,255,0.22)), url('/logo.png')",
      }}
    >
      <div className="w-full max-w-[1350px] grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
        <div className="hidden lg:flex flex-col justify-center h-full pl-8">
          <div className="flex items-center gap-5 mb-7">
            <Recycle className="text-green-700" size={68} />

            <div>
              <h1 className="text-[58px] font-semibold leading-none text-black tracking-tight">
                SWRaCMS
              </h1>

              <p className="mt-4 text-[18px] leading-relaxed text-black/80">
                Smart Waste Recording and <br />
                Collection Management System <br />
                for the Barangays of Sibalom
              </p>
            </div>
          </div>

          <div className="w-20 h-[3px] bg-green-600 mb-8"></div>

          <p className="text-[26px] font-light leading-[1.45] text-black max-w-[620px]">
            A digital solution for efficient <br />
            waste reporting, collection <br />
            management, monitoring, <br />
            and a cleaner community.
          </p>

          <div className="mt-10 space-y-5">
            <Feature icon={<ClipboardCheck size={24} />} title="Report" desc="Waste Issues" />
            <Feature icon={<CalendarDays size={24} />} title="Manage" desc="Collections" />
            <Feature icon={<BarChart3 size={24} />} title="Monitor" desc="Performance" />
          </div>
        </div>

        <div className="w-full max-w-[650px] bg-white/95 backdrop-blur-xl rounded-[36px] shadow-2xl px-8 py-8 mx-auto">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <Leaf className="text-green-700" size={50} />
            </div>

            <h2 className="text-[44px] font-bold text-black leading-tight">
              Welcome to <span className="text-green-700">SWRaCMS!</span>
            </h2>

            <div className="flex items-center justify-center gap-3 my-4">
              <div className="w-20 h-[2px] bg-green-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="w-20 h-[2px] bg-green-500"></div>
            </div>

            <p className="text-[18px] text-gray-500 mb-7">
              Please select your role to continue.
            </p>
          </div>

          <div className="space-y-4">
            {roles.map((role) => (
              <button
                key={role.title}
                onClick={() => openLogin(role)}
                className={`w-full border ${colors[role.color].border} ${colors[role.color].bg}
                rounded-[24px] p-4 flex items-center justify-between
                hover:scale-[1.01] hover:shadow-xl transition duration-300`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-20 h-20 rounded-[22px] ${colors[role.color].icon}
                    flex items-center justify-center text-white shadow-lg`}
                  >
                    {role.icon}
                  </div>

                  <div className="text-left">
                    <h3 className={`text-[28px] font-semibold ${colors[role.color].text}`}>
                      {role.title}
                    </h3>

                    <p className="text-[15px] leading-relaxed text-black/70 max-w-[360px] mt-1">
                      {role.desc}
                    </p>
                  </div>
                </div>

                <ChevronRight className={colors[role.color].text} size={38} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-5 my-7">
            <div className="flex-1 h-[1px] bg-gray-300"></div>
            <Leaf className="text-green-600" size={26} />
            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div>

          <div className="text-center text-[18px] text-gray-700">
            <p className="flex items-center justify-center gap-3 flex-wrap">
              <ShieldCheck className="text-green-700" size={22} />
              Secure
              <span className="text-green-600">•</span>
              Transparent
              <span className="text-green-600">•</span>
              Efficient
            </p>

            <p className="text-gray-500 mt-2 text-[16px]">
              Working together for a cleaner Sibalom.
            </p>
          </div>
        </div>
      </div>

      {selectedRole && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[520px] p-7 relative">
            <button
              onClick={closeLogin}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div
                className={`w-20 h-20 mx-auto rounded-2xl ${colors[selectedRole.color].icon}
                flex items-center justify-center text-white shadow-lg mb-4`}
              >
                {selectedRole.icon}
              </div>

              <h3 className="text-3xl font-bold text-black">
                {selectedRole.title} Login
              </h3>

              <p className="text-gray-500 mt-2">
                Use an authorized account registered by the LGU Admin.
              </p>
            </div>

            <div className="space-y-3">

              {/* GOOGLE BUTTON */}
              <button
                onClick={() => handleOAuthLogin("google")}
                className="w-full border border-gray-300 bg-white rounded-2xl py-3 px-4 font-semibold hover:bg-gray-50 flex items-center justify-center gap-3 transition"
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                  alt="Google"
                  className="w-5 h-5"
                />

                <span className="text-gray-700">
                  Continue with Google
                </span>
              </button>

              {/* GITHUB BUTTON */}
              <button
                onClick={() => handleOAuthLogin("github")}
                className="w-full bg-black text-white rounded-2xl py-3 px-4 font-semibold hover:bg-gray-900 flex items-center justify-center gap-3 transition"
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                  alt="GitHub"
                  className="w-5 h-5 invert"
                />

                <span>
                  Continue with GitHub
                </span>
              </button>

            </div>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-[1px] bg-gray-300"></div>
              <span className="text-sm text-gray-400">or</span>
              <div className="flex-1 h-[1px] bg-gray-300"></div>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-green-500"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-green-500"
              />

              {error && (
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleEmailLogin}
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white rounded-2xl py-4 text-lg font-semibold transition"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-5">
              If your account is not yet approved, please contact the LGU Admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 shadow">
        {icon}
      </div>

      <div>
        <p className="text-[18px] font-semibold text-black">{title}</p>
        <p className="text-[15px] text-black/70">{desc}</p>
      </div>
    </div>
  );
}