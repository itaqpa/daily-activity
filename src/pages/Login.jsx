import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  Clock3,
  Users,
  FileText,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';
import { apiUrl } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { updateUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  // Redirect unconditionally to Portal
  const redirectBasedOnRole = (userData) => {
    navigate('/portal');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    
    if (token) {
      const user = userString ? JSON.parse(userString) : null;
      redirectBasedOnRole(user);
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setErrorMsg('');

    try {
      const API_URL = apiUrl('/login');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);

        if (data.user) {
          updateUser(data.user);
        }

        if (rememberMe) {
          localStorage.setItem(
            'remember_email',
            email
          );
        } else {
          localStorage.removeItem(
            'remember_email'
          );
        }

        redirectBasedOnRole(data.user);
      } else {
        setErrorMsg(
          data.message ||
          'Login gagal. Periksa kembali email dan password Anda.'
        );
      }
    } catch (error) {
      setErrorMsg(
        'Terjadi kesalahan jaringan. Gagal terhubung ke server.'
      );

      console.error(
        'Login error:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f7f9fc] overflow-hidden">

      {/* ======================================================
          LEFT PANEL
      ====================================================== */}
      <section
        className="
          hidden lg:flex
          lg:w-[47%]
          relative
          overflow-hidden
          bg-gradient-to-br
          from-[#0758ea]
          via-[#096bf4]
          to-[#168cf7]
        "
      >
        {/* Background Decoration */}
        <div className="absolute inset-0 pointer-events-none">

          {/* Top Circle */}
          <div
            className="
              absolute
              -top-[300px]
              -right-[180px]
              w-[760px]
              h-[760px]
              rounded-full
              bg-white/[0.08]
            "
          />

          <div
            className="
              absolute
              -top-[230px]
              -right-[120px]
              w-[760px]
              h-[760px]
              rounded-full
              border
              border-white/[0.10]
            "
          />

          {/* Bottom Circle */}
          <div
            className="
              absolute
              -bottom-[320px]
              -left-[300px]
              w-[700px]
              h-[700px]
              rounded-full
              bg-white/[0.07]
            "
          />

          {/* Glow */}
          <div
            className="
              absolute
              top-[25%]
              left-[15%]
              w-[360px]
              h-[360px]
              bg-cyan-300/10
              rounded-full
              blur-[100px]
            "
          />

          {/* Dot Grid */}
          <div
            className="
              absolute
              top-8
              left-8
              w-36
              h-24
              opacity-20
            "
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1.4px, transparent 1.4px)',
              backgroundSize: '16px 16px',
            }}
          />
        </div>

        <div
          className="
            relative
            z-10
            w-full
            min-h-screen
            flex
            flex-col
            px-14
            xl:px-20
            py-14
          "
        >
          {/* BRANDING */}
          <div className="max-w-xl">

            <div
              className="
                w-[280px]
                h-auto
                mb-4
              "
            >
              <img 
                src="/logo/aqpa-indonesia-logo.png" 
                alt="AQPA Logo" 
                className="w-full h-auto object-contain drop-shadow-xl brightness-0 invert" 
              />
            </div>

            <p
              className="
                mt-5
                text-[17px]
                font-medium
                text-blue-100
              "
            >
              Daily Activity Management System
            </p>

            <div
              className="
                mt-6
                mb-5
                h-[4px]
                w-14
                rounded-full
                bg-cyan-300
              "
            />

            <p
              className="
                max-w-md
                text-[16px]
                leading-7
                text-blue-50/90
              "
            >
              Kelola aktivitas, progres, dan pekerjaan
              harian dalam satu platform yang
              terintegrasi.
            </p>
          </div>

          {/* ======================================================
              DASHBOARD PREVIEW
          ====================================================== */}
          <div
            className="
              relative
              mt-auto
              h-[410px]
            "
          >

            {/* Fake Dashboard */}
            <div
              className="
                absolute
                left-[-70px]
                bottom-[-60px]
                w-[650px]
                xl:w-[720px]
                h-[350px]
                rounded-[28px]
                border
                border-white/[0.12]
                bg-white/[0.09]
                backdrop-blur-sm
                rotate-[-3deg]
                overflow-hidden
                shadow-2xl
              "
            >
              <div
                className="
                  h-12
                  border-b
                  border-white/10
                  flex
                  items-center
                  px-6
                  text-white
                  text-sm
                  font-bold
                "
              >
                AQPA Dashboard
              </div>

              <div className="flex h-full">

                <div
                  className="
                    w-24
                    border-r
                    border-white/10
                    p-4
                    space-y-5
                  "
                >
                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <div
                        key={item}
                        className="
                          h-3
                          rounded-full
                          bg-white/10
                        "
                      />
                    )
                  )}
                </div>

                <div className="flex-1 p-7">

                  <div
                    className="
                      grid
                      grid-cols-3
                      gap-4
                      mb-6
                    "
                  >
                    {[1, 2, 3].map(
                      (item) => (
                        <div
                          key={item}
                          className="
                            h-[72px]
                            rounded-2xl
                            bg-white/[0.08]
                          "
                        />
                      )
                    )}
                  </div>

                  <div
                    className="
                      h-[150px]
                      rounded-2xl
                      bg-white/[0.07]
                      px-7
                      pb-6
                      flex
                      items-end
                      gap-4
                    "
                  >
                    {[
                      45,
                      78,
                      60,
                      105,
                      88,
                      120,
                      95,
                    ].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="
                            flex-1
                            bg-white/20
                            rounded-t-md
                          "
                          style={{
                            height: `${height}px`,
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Task */}
            <div
              className="
                absolute
                left-[-5px]
                bottom-[15px]
                w-[255px]
                rounded-[24px]
                bg-white
                p-5
                rotate-[-4deg]
                shadow-[0_24px_60px_rgba(0,0,0,0.20)]
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-blue-100
                    flex
                    items-center
                    justify-center
                  "
                >
                  <CheckCircle2
                    className="
                      w-5
                      h-5
                      text-blue-600
                    "
                  />
                </div>

                <span
                  className="
                    font-bold
                    text-gray-900
                  "
                >
                  Daily Task
                </span>
              </div>

              <div
                className="
                  mt-5
                  flex
                  items-end
                  justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-[36px]
                      leading-none
                      font-extrabold
                      text-[#0d1833]
                    "
                  >
                    08
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-400
                    "
                  >
                    Completed
                  </p>
                </div>

                <span
                  className="
                    text-sm
                    font-bold
                    text-emerald-500
                  "
                >
                  ↑ +2
                </span>
              </div>

              <div
                className="
                  mt-5
                  space-y-3
                "
              >
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          w-5
                          h-5
                          rounded-md
                          bg-blue-600
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <CheckCircle2
                          className="
                            w-3
                            h-3
                            text-white
                          "
                        />
                      </div>

                      <div
                        className="
                          h-2
                          flex-1
                          rounded-full
                          bg-gray-200
                        "
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Progress */}
            <div
              className="
                absolute
                top-[55px]
                left-[235px]
                xl:left-[275px]
                w-[320px]
                xl:w-[350px]
                bg-white
                rounded-[22px]
                p-5
                shadow-[0_24px_60px_rgba(0,0,0,0.18)]
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-blue-100
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <BarChart3
                      className="
                        w-5
                        h-5
                        text-blue-600
                      "
                    />
                  </div>

                  <span
                    className="
                      font-bold
                      text-gray-900
                    "
                  >
                    Progress
                  </span>
                </div>

                <span
                  className="
                    font-extrabold
                    text-gray-950
                  "
                >
                  82%
                </span>
              </div>

              <div
                className="
                  mt-5
                  h-2.5
                  rounded-full
                  bg-blue-100
                  overflow-hidden
                "
              >
                <div
                  className="
                    h-full
                    w-[82%]
                    rounded-full
                    bg-gradient-to-r
                    from-blue-600
                    to-cyan-400
                  "
                />
              </div>

              <div
                className="
                  mt-3
                  flex
                  justify-between
                  text-xs
                "
              >
                <span className="text-gray-400">
                  124 dari 150 aktivitas
                </span>

                <span
                  className="
                    font-bold
                    text-emerald-500
                  "
                >
                  ↑ +12%
                </span>
              </div>
            </div>

            {/* Activity */}
            <div
              className="
                absolute
                left-[310px]
                xl:left-[350px]
                bottom-[-10px]
                w-[310px]
                xl:w-[340px]
                rounded-[24px]
                bg-white
                p-5
                rotate-[2deg]
                shadow-[0_24px_60px_rgba(0,0,0,0.18)]
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                  mb-5
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-blue-100
                    flex
                    items-center
                    justify-center
                  "
                >
                  <CalendarDays
                    className="
                      w-5
                      h-5
                      text-blue-600
                    "
                  />
                </div>

                <span
                  className="
                    font-bold
                    text-gray-900
                  "
                >
                  Activity
                </span>
              </div>

              <div className="space-y-4">

                <ActivityItem
                  icon={
                    <Users className="w-4 h-4" />
                  }
                  iconClass="bg-blue-100 text-blue-600"
                  title="Meeting Tim"
                  time="09:00 - 10:00"
                />

                <ActivityItem
                  icon={
                    <FileText className="w-4 h-4" />
                  }
                  iconClass="bg-emerald-100 text-emerald-600"
                  title="Update Progress"
                  time="10:30 - 11:00"
                />

                <ActivityItem
                  icon={
                    <Clock3 className="w-4 h-4" />
                  }
                  iconClass="bg-orange-100 text-orange-500"
                  title="Review & Planning"
                  time="13:00 - 14:00"
                />

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          RIGHT PANEL
      ====================================================== */}
      <main
        className="
          relative
          w-full
          lg:w-[53%]
          min-h-screen
          flex
          items-center
          justify-center
          px-6
          sm:px-10
          lg:px-16
          xl:px-24
          bg-[#fbfcfe]
          overflow-hidden
        "
      >
        {/* Background decoration */}
        <div
          className="
            absolute
            -top-[240px]
            -right-[240px]
            w-[540px]
            h-[540px]
            rounded-full
            border-[34px]
            border-blue-50
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            -bottom-[300px]
            -left-[280px]
            w-[560px]
            h-[560px]
            rounded-full
            border-[30px]
            border-blue-50
            pointer-events-none
          "
        />

        <div
          className="
            relative
            z-10
            w-full
            max-w-[500px]
          "
        >
          {/* MOBILE LOGO */}
          <div className="lg:hidden text-center mb-10 flex flex-col items-center">

            <div
              className="
                inline-flex
                w-48
                h-auto
                items-center
                justify-center
                mb-2
              "
            >
              <img 
                src="/logo/aqpa-indonesia-logo.png" 
                alt="AQPA Logo" 
                className="w-full h-auto object-contain drop-shadow-sm" 
              />
            </div>

            <p
              className="
                mt-2
                text-sm
                text-gray-400
              "
            >
              Daily Activity Management System
            </p>
          </div>

          {/* DESKTOP SMALL BRAND */}
          <div
            className="
              hidden
              lg:flex
              items-center
              justify-center
              mb-8
            "
          >
            <div
              className="
                w-44
                h-auto
                flex
                items-center
                justify-center
              "
            >
              <img 
                src="/logo/aqpa-indonesia-logo.png" 
                alt="AQPA Logo" 
                className="w-full h-auto object-contain" 
              />
            </div>
          </div>

          {/* HEADER */}
          <div
            className="
              text-center
              mb-9
            "
          >
            <h2
              className="
                text-[34px]
                lg:text-[40px]
                leading-tight
                font-extrabold
                tracking-[-0.03em]
                text-[#0b1834]
              "
            >
              Selamat Datang Kembali
            </h2>

            <p
              className="
                mt-3
                text-[15px]
                lg:text-[16px]
                text-gray-400
              "
            >
              Masuk untuk melanjutkan aktivitas Anda.
            </p>
          </div>

          {/* ERROR */}
          {errorMsg && (
            <div
              className="
                mb-6
                flex
                items-start
                gap-3
                rounded-[14px]
                border
                border-red-100
                bg-red-50
                px-4
                py-3.5
              "
            >
              <AlertCircle
                className="
                  mt-0.5
                  w-5
                  h-5
                  shrink-0
                  text-red-500
                "
              />

              <p
                className="
                  text-sm
                  leading-5
                  text-red-700
                "
              >
                {errorMsg}
              </p>
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleLogin}
            className="space-y-6"
          >
            {/* EMAIL / USERNAME */}
            <div>
              <label
                htmlFor="email"
                className="
                  block
                  mb-2
                  text-[13px]
                  font-semibold
                  text-[#273553]
                "
              >
                Username atau Email
              </label>

              <div className="relative group">

                <div
                  className="
                    absolute
                    inset-y-0
                    left-0
                    w-14
                    flex
                    items-center
                    justify-center
                    pointer-events-none
                  "
                >
                  <Mail
                    className="
                      w-5
                      h-5
                      text-[#9aa8bc]
                      group-focus-within:text-blue-600
                      transition-colors
                    "
                  />
                </div>

                <input
                  id="email"
                  type="text"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  placeholder="admin / email@aqpa.id"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    h-[58px]
                    rounded-[14px]
                    border
                    border-[#dce4ef]
                    bg-[#f8faff]
                    pl-14
                    pr-5
                    text-[15px]
                    text-gray-900
                    outline-none
                    transition-all
                    placeholder:text-[#9daabd]

                    hover:border-blue-300

                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10

                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="
                  block
                  mb-2
                  text-[13px]
                  font-semibold
                  text-[#273553]
                "
              >
                Password
              </label>

              <div className="relative group">

                <div
                  className="
                    absolute
                    inset-y-0
                    left-0
                    w-14
                    flex
                    items-center
                    justify-center
                    pointer-events-none
                  "
                >
                  <Lock
                    className="
                      w-5
                      h-5
                      text-[#9aa8bc]
                      group-focus-within:text-blue-600
                      transition-colors
                    "
                  />
                </div>

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi Anda"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    h-[58px]
                    rounded-[14px]
                    border
                    border-[#dce4ef]
                    bg-[#f8faff]
                    pl-14
                    pr-14
                    text-[15px]
                    text-gray-900
                    outline-none
                    transition-all
                    placeholder:text-[#9daabd]

                    hover:border-blue-300

                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10

                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="
                    absolute
                    inset-y-0
                    right-0
                    w-14
                    flex
                    items-center
                    justify-center
                    text-[#9aa8bc]
                    hover:text-blue-600
                    transition-colors
                  "
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* REMEMBER / FORGOT */}
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <label
                className="
                  flex
                  items-center
                  gap-2.5
                  cursor-pointer
                  select-none
                "
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isLoading}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                  className="
                    h-[17px]
                    w-[17px]
                    rounded
                    border-gray-300
                    text-blue-600
                    focus:ring-blue-500
                  "
                />

                <span
                  className="
                    text-sm
                    text-gray-600
                  "
                >
                  Ingat saya
                </span>
              </label>

              <button
                type="button"
                className="
                  text-sm
                  font-semibold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                group
                w-full
                h-[60px]
                rounded-[14px]
                bg-gradient-to-r
                from-[#176ff4]
                to-[#0862ee]
                text-white
                text-[15px]
                font-bold
                flex
                items-center
                justify-center
                gap-3
                shadow-[0_14px_28px_rgba(9,99,239,0.24)]
                transition-all

                ${isLoading
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:-translate-y-[1px] hover:shadow-[0_18px_34px_rgba(9,99,239,0.30)] active:scale-[0.99]'
                }
              `}
            >
              {isLoading ? (
                <>
                  <LoaderCircle
                    className="
                      w-5
                      h-5
                      animate-spin
                    "
                  />

                  <span>
                    Memproses...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Masuk ke Sistem
                  </span>

                  <ArrowRight
                    className="
                      w-5
                      h-5
                      transition-transform
                      group-hover:translate-x-1
                    "
                  />
                </>
              )}
            </button>
          </form>

          {/* ADMIN INFO */}
          <div
            className="
              mt-8
              flex
              items-center
              gap-4
            "
          >
            <div
              className="
                h-px
                flex-1
                bg-gray-200
              "
            />

            <span
              className="
                whitespace-nowrap
                text-[12px]
                text-gray-400
              "
            >
              Akses akun dikelola oleh Administrator.
            </span>

            <div
              className="
                h-px
                flex-1
                bg-gray-200
              "
            />
          </div>

          {/* FOOTER */}
          <p
            className="
              mt-16
              lg:mt-20
              text-center
              text-[12px]
              text-gray-400
            "
          >
            © {new Date().getFullYear()} PT AQPA Indonesia
            {' · '}
            Internal System
          </p>
        </div>
      </main>
    </div>
  );
}

function ActivityItem({
  icon,
  iconClass,
  title,
  time,
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
      "
    >
      <div
        className={`
          w-9
          h-9
          shrink-0
          rounded-xl
          flex
          items-center
          justify-center
          ${iconClass}
        `}
      >
        {icon}
      </div>

      <div>
        <p
          className="
            text-[12px]
            font-bold
            text-gray-800
          "
        >
          {title}
        </p>

        <p
          className="
            mt-0.5
            text-[11px]
            text-gray-400
          "
        >
          {time}
        </p>
      </div>
    </div>
  );
}

