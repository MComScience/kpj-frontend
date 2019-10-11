import { Button } from "antd"
import classNames from "classnames"
import { Formik } from "formik"
import Link from "next/link"
import Router from "next/router"
import React, { Component } from "react"
import Swal from "sweetalert2"
import * as Yup from "yup"
import axios from "../../axios"
import Head from "../../components/head"
import Aux from "../../hoc/Auxiliary"
import { isEmpty } from "../../utils"

class SignUp extends Component {
  state = {
    formAttributes: {
      name: "",
      email: "",
      username: "",
      password: ""
    },
    submitted: false
  }

  componentDidMount() {
    document.body.classList = "hold-transition register-page"
  }

  componentWillUnmount() {
    document.body.classList = "hold-transition skin-green-light sidebar-mini"
  }

  handleSubmit = async (values, resetForm) => {
    this.setState({ submitted: true })
    try {
      const { data } = await axios.post(`/user/register`, values)
      const formAttributes = await this.resetForm()
      await resetForm(formAttributes)
      this.setState({ submitted: false })
      Swal.fire({
        type: "success",
        title: "",
        text: data.message,
        showConfirmButton: false,
        timer: 3000
      })
      Router.push("/auth/sign-in")
    } catch (error) {
      this.setState({ submitted: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  resetForm() {
    let formAttributes = this.state.formAttributes
    for (const key in formAttributes) {
      formAttributes[key] = ""
    }
    return formAttributes
  }

  hasError = (errors, touched, field) => {
    const isError = !isEmpty((errors[field] && touched[field]) || errors[field])
    return isError ? "has-error" : ""
  }

  getErrorMsg = (errors, touched, field) => {
    return (errors[field] && touched[field]) || errors[field]
  }

  render() {
    return (
      <Aux>
        <Head title="ลงทะเบียน" />
        <div className="register-box">
          <div className="register-logo">
            <Link href="/">
              <a>
                <b>KPJ Hospital</b>
              </a>
            </Link>
          </div>
          <div className="register-box-body">
            <p className="login-box-msg">ลงทะเบียนผู้ใช้งาน</p>
            <Formik
              initialValues={this.state.formAttributes}
              onSubmit={(values, { setSubmitting, resetForm }) => {
                this.handleSubmit(values, resetForm)
                setSubmitting(false)
              }}
              validationSchema={Yup.object().shape({
                name: Yup.string().required(),
                email: Yup.string()
                  .email()
                  .required(),
                username: Yup.string()
                  .min(3)
                  .matches(/^[-a-zA-Z0-9_\\.@]+$/, { excludeEmptyString: true })
                  .required(),
                password: Yup.string()
                  .min(6)
                  .required()
              })}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
                isSubmitting,
                dirty
              }) => (
                <form onSubmit={handleSubmit}>
                  <div
                    className={classNames(
                      "form-group has-feedback",
                      this.hasError(errors, touched, "name")
                    )}
                  >
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full name"
                      autoComplete="off"
                      name="name"
                      onChange={handleChange}
                      value={values.name}
                    />
                    <span className="glyphicon glyphicon-user form-control-feedback" />
                    <span className="help-block">
                      {(errors.name && touched.name) || errors.name}
                    </span>
                  </div>
                  <div
                    className={classNames(
                      "form-group has-feedback",
                      this.hasError(errors, touched, "email")
                    )}
                  >
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      name="email"
                      onChange={handleChange}
                      value={values.email}
                    />
                    <span className="glyphicon glyphicon-envelope form-control-feedback" />
                    <span className="help-block">
                      {(errors.email && touched.email) || errors.email}
                    </span>
                  </div>
                  <div
                    className={classNames(
                      "form-group has-feedback",
                      this.hasError(errors, touched, "username")
                    )}
                  >
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Username"
                      autoComplete="off"
                      name="username"
                      onChange={handleChange}
                      value={values.username}
                    />
                    <span className="glyphicon glyphicon-user form-control-feedback" />
                    <span className="help-block">
                      {(errors.username && touched.username) || errors.username}
                    </span>
                  </div>
                  <div
                    className={classNames(
                      "form-group has-feedback",
                      this.hasError(errors, touched, "password")
                    )}
                  >
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      name="password"
                      onChange={handleChange}
                      value={values.password}
                    />
                    <span className="glyphicon glyphicon-lock form-control-feedback" />
                    <span className="help-block">
                      {(errors.password && touched.password) || errors.password}
                    </span>
                  </div>
                  <div className="row">
                    <div className="col-xs-12">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={this.state.submitted}
                        disabled={isSubmitting || this.state.submitted}
                        block
                      >
                        ลงทะเบียน
                      </Button>
                    </div>
                    {/* /.col */}
                  </div>
                </form>
              )}
            </Formik>

            <div className="text-center">
              <Link href="/auth/sign-in">
                <a className="text-center">
                  ถ้าหากคุณมีบัญชีแล้ว? เข้าสู่ระบบได้ที่นี่!
                </a>
              </Link>
            </div>
          </div>
          {/* /.form-box */}
        </div>
        {/* /.register-box */}
      </Aux>
    )
  }
}

export default SignUp
