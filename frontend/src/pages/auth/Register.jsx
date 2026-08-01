import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "../../context/LanguageContext";
import { registerUser } from "../../services/auth.service";

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "developer",
    category: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/categories"
      );

      setCategories(data.categories || data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await registerUser(formData);

      setSuccessMsg("Registration successful!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">

      <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl">

        <h1 className="text-3xl text-white font-bold mb-8 text-center">
          Create Account
        </h1>

        {errorMsg && (
          <div className="bg-red-500 text-white p-3 rounded mb-5">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-500 text-white p-3 rounded mb-5">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            onChange={handleChange}
            className="w-full p-3 rounded bg-slate-800 text-white"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            onChange={handleChange}
            className="w-full p-3 rounded bg-slate-800 text-white"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            onChange={handleChange}
            className="w-full p-3 rounded bg-slate-800 text-white"
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-3 rounded bg-slate-800 text-white"
          >
            <option value="developer">
              Developer
            </option>

            <option value="client">
              Client
            </option>

          </select>

          {formData.role === "developer" && (

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full p-3 rounded bg-slate-800 text-white"
            >
              <option value="">
                Select your specialization
              </option>

              {categories.map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              ))}

            </select>

          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 p-3 rounded font-bold"
          >
            {loading
              ? "Creating..."
              : "Register"}
          </button>

        </form>

        <p className="text-center text-slate-400 mt-6">
          Already have an account?

          <Link
            to="/login"
            className="text-cyan-400 ml-2"
          >
            Login
          </Link>

        </p>

      </div>

    </div>
  );
};

export default Register;