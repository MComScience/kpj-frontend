import { Button } from "antd"
import { Formik } from "formik"
import Link from "next/link"
import Router from "next/router"
import React, { Component } from "react"
import { connect } from "react-redux"
import Swal from "sweetalert2"
import * as Yup from "yup"
import axios from "../../axios"
import Head from "../../components/head"
import Aux from "../../hoc/Auxiliary"
import { authCheckState, authSuccess } from "../../store/actions"

class Signin extends Component {
  state = {
    isValid: false,
    submitted: false,
    formAttributes: {
      username: "",
      password: ""
    }
  }

  componentDidMount() {
    if (this.props.isLoggedIn) {
      Router.push("/")
    }
    document.body.classList = "hold-transition login-page"
  }

  componentWillUnmount() {
    document.body.classList = "hold-transition skin-green-light sidebar-mini"
  }

  handleSubmit = async values => {
    try {
      const { data } = await axios.post(`/user/sign-in`, values)
      await this.props.authSuccess(data)
      await new Promise(resolve => {
        setTimeout(() => {
          this.props.authCheckState()
          resolve()
        }, 300)
      })
      Router.push("/")
      document.body.classList = "hold-transition skin-green-light sidebar-mini"
      this.setState({ submitted: false })
    } catch (error) {
      this.setState({ submitted: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  handleChange(event, attr) {
    this.setState({ [attr]: event.target.value })
    const isValid = this.state.username !== "" && !this.state.password !== ""
    this.setState({ isValid: isValid })
  }

  render() {
    return (
      <Aux>
        <Head title={"Sign in"} />
        <div className="login-box">
          <div className="login-logo">
            <Link href="/">
              <a>
                <b>KPJ Hospital</b>
              </a>
            </Link>
          </div>
          {/* /.login-logo */}
          <div className="login-box-body">
            <p className="login-box-msg">เข้าสู่ระบบ</p>
            <Formik
              initialValues={this.state.formAttributes}
              onSubmit={(values, { setSubmitting }) => {
                this.setState({ submitted: true })
                this.handleSubmit(values)
                setSubmitting(false)
              }}
              validationSchema={Yup.object().shape({
                username: Yup.string().min(3),
                password: Yup.string().min(6)
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
                <form onSubmit={handleSubmit} id="loginForm">
                  <div className="form-group has-feedback">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Email or Username"
                      name="username"
                      id="username"
                      onChange={handleChange}
                      value={values.username}
                    />
                    <span className="glyphicon glyphicon-envelope form-control-feedback" />
                    <span className="help-block">
                      {errors.username && touched.username && errors.username}
                    </span>
                  </div>
                  <div className="form-group has-feedback">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      name="password"
                      id="password"
                      onChange={handleChange}
                      value={values.password}
                    />
                    <span className="fa fa-lock form-control-feedback" />
                    <span className="help-block">
                      {errors.password && touched.password && errors.password}
                    </span>
                  </div>
                  <div className="row">
                    {/* /.col */}
                    <div className="col-xs-12">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={this.state.submitted}
                        disabled={
                          !dirty || isSubmitting || this.state.submitted
                        }
                        block
                      >
                        เข้าสู่ระบบ
                      </Button>
                    </div>
                    {/* /.col */}
                  </div>
                </form>
              )}
            </Formik>

            {/* /.social-auth-links */}
            <br />
            <div className="text-center">
              <Link href="/auth/sign-up">
                <a className="text-center">ลงทะเบียนผู้ใช้งาน</a>
              </Link>
            </div>
          </div>
          {/* /.login-box-body */}
        </div>
        {/* /.login-box */}
      </Aux>
    )
  }
}

const mapStateToProps = state => {
  return {
    isLoggedIn: state.auth.isLoggedIn
  }
}

const mapDispatchToProps = dispatch => {
  return {
    authSuccess: authData => dispatch(authSuccess(authData)),
    authCheckState: () => dispatch(authCheckState())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Signin)
