import { Button, Select, Spin, Tabs } from "antd"
import classNames from "classnames"
import { Formik } from "formik"
import moment from "moment-timezone"
import { withRouter } from "next/router"
import React, { Component } from "react"
import Swal from "sweetalert2"
import * as Yup from "yup"
import axios from "../../../axios"
import Head from "../../../components/head"
import Layout from "../../../components/layout"
import withAuth from '../../../hoc/authHandler'
import Aux from "../../../hoc/Auxiliary"
import { isEmpty, updateObject } from "../../../utils"
const { TabPane } = Tabs
const { Option } = Select

class UpdateUser extends Component {
  state = {
    loading: false,
    submitted: false,
    user: null,
    accountAttributes: {
      id: "",
      email: "",
      username: "",
      password: "",
      role: ""
    },
    profileAttributes: {
      user_id: "",
      name: "",
      public_email: "",
      gravatar_email: "",
      gravatar_id: "",
      location: "",
      website: "",
      bio: "",
      timezone: ""
    },
    roles: [
      {
        value: 10,
        label: "ผู้ใช้งานทั่วไป"
      },
      {
        value: 20,
        label: "ผู้ดูแลระบบ"
      },
      {
        value: 30,
        label: "ตู้กดบัตรคิว"
      }
    ],
    timezones: []
  }

  componentDidMount() {
    this.fetchUser()
    this.mapTimezoneOptions()
  }

  mapTimezoneOptions() {
    const timezones = moment.tz.names()
    let mapTimezones = []
    timezones.map(tz => {
      if (tz.includes("Asia")) {
        mapTimezones.push({
          id: tz,
          value: tz
        })
      }
    })
    this.setState({ timezones: mapTimezones })
  }

  fetchUser = async () => {
    const { router } = this.props
    try {
      this.setState({ loading: true })
      const { data } = await axios.get(`/user/${router.query.id}`)
      let accountAttributes = await this.state.accountAttributes
      let profileAttributes = await this.state.profileAttributes
      for (const key in data) {
        if (accountAttributes.hasOwnProperty(key)) {
          accountAttributes[key] = data[key]
        }
        if (profileAttributes.hasOwnProperty(key)) {
          profileAttributes[key] = isEmpty(data[key]) ? "" : data[key]
        }
      }
      this.setState({
        accountAttributes: accountAttributes,
        profileAttributes: profileAttributes,
        user: data,
        loading: false
      })
    } catch (error) {
      this.setState({ loading: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  handleSubmitAccount = async values => {
    this.setState({ submitted: true })
    const userId = await this.state.accountAttributes.id
    const params = await updateObject(values, { id: userId })
    try {
      const { data } = await axios.post(
        `/user/update-account/${userId}`,
        params
      )
      this.setState({ submitted: false })
      Swal.fire({
        type: "success",
        title: "Success!",
        text: data.message,
        showConfirmButton: false,
        timer: 3000
      })
    } catch (error) {
      this.setState({ submitted: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  handleSubmitProfile = async values => {
    this.setState({ submitted: true })
    const userId = await this.state.accountAttributes.id
    const params = await updateObject(values, { user_id: userId })
    try {
      const { data } = await axios.post(
        `/user/update-profile/${userId}`,
        params
      )
      this.setState({ submitted: false })
      Swal.fire({
        type: "success",
        title: "Success!",
        text: data.message,
        showConfirmButton: false,
        timer: 3000
      })
    } catch (error) {
      this.setState({ submitted: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  hasError = (errors, touched, field) => {
    const isError = !isEmpty((errors[field] && touched[field]) || errors[field])
    return isError ? "has-error" : ""
  }

  handleChangeRole = value => {
    const accountAttributes = this.state.accountAttributes
    const updatedAccountAttributes = Object.assign(accountAttributes, {
      role: value
    })
    this.setState({ accountAttributes: updatedAccountAttributes })
  }

  handleChangeTimezone = value => {
    const profileAttributes = this.state.profileAttributes
    const updatedProfileAttributes = Object.assign(profileAttributes, {
      timezone: value
    })
    this.setState({ profileAttributes: updatedProfileAttributes })
  }

  render() {
    return (
      <Aux>
        <Head title="แก้ไขข้อมูลผู้ใช้งาน" />
        <Layout title="แก้ไขข้อมูลผู้ใช้งาน" breadcrumb="แก้ไขข้อมูลผู้ใช้งาน">
          <div className="row">
            <div className="col-md-3">
              <div className="box box-primary">
                <div className="box-body box-profile">
                  <img
                    className="profile-user-img img-responsive img-circle"
                    src="/static/images/boy.png"
                    alt="User profile picture"
                  />
                  <h3 className="profile-username text-center">
                    {this.state.user ? this.state.user.name : ""}
                  </h3>
                  <p className="text-muted text-center"></p>
                </div>
                {/* /.box-body */}
              </div>
            </div>
            <div className="col-md-9">
              <div className="box">
                <div className="box-body">
                  <Tabs defaultActiveKey="1">
                    <TabPane tab="การตั้งค่าบัญชี" key="1">
                      {this.state.loading ? (
                        <div className="loading">
                          <Spin size="large" />
                        </div>
                      ) : (
                        <Formik
                          initialValues={this.state.accountAttributes}
                          onSubmit={(values, { setSubmitting }) => {
                            this.handleSubmitAccount(values)
                            setSubmitting(false)
                          }}
                          validationSchema={Yup.object().shape({
                            email: Yup.string()
                              .email()
                              .required(),
                            username: Yup.string()
                              .min(3)
                              .matches(/^[-a-zA-Z0-9_\\.@]+$/, {
                                excludeEmptyString: true
                              })
                              .required(),
                            password: Yup.string().min(6),
                            role: Yup.string().required()
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
                            <form
                              className="form-horizontal"
                              onSubmit={handleSubmit}
                            >
                              <div
                                className={classNames(
                                  "form-group",
                                  this.hasError(errors, touched, "email")
                                )}
                              >
                                <label
                                  htmlFor="email"
                                  className="col-sm-2 control-label"
                                >
                                  อีเมล
                                </label>
                                <div className="col-sm-10">
                                  <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    placeholder="อีเมล"
                                    name="email"
                                    autoComplete="off"
                                    onChange={handleChange}
                                    value={values.email}
                                  />
                                  <span className="help-block">
                                    {(errors.email && touched.email) ||
                                      errors.email}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={classNames(
                                  "form-group",
                                  this.hasError(errors, touched, "username")
                                )}
                              >
                                <label
                                  htmlFor="username"
                                  className="col-sm-2 control-label"
                                >
                                  ชื่อผู้ใช้
                                </label>
                                <div className="col-sm-10">
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="username"
                                    placeholder="ชื่อผู้ใช้"
                                    name="username"
                                    autoComplete="off"
                                    onChange={handleChange}
                                    value={values.username}
                                  />
                                  <span className="help-block">
                                    {(errors.username && touched.username) ||
                                      errors.username}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={classNames(
                                  "form-group",
                                  this.hasError(errors, touched, "password")
                                )}
                              >
                                <label
                                  htmlFor="password"
                                  className="col-sm-2 control-label"
                                >
                                  รหัสผ่าน
                                </label>
                                <div className="col-sm-10">
                                  <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    placeholder="รหัสผ่าน"
                                    name="password"
                                    autoComplete="off"
                                    onChange={handleChange}
                                    value={values.password}
                                  />
                                  <span className="help-block">
                                    {(errors.password && touched.password) ||
                                      errors.password}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={classNames(
                                  "form-group",
                                  this.hasError(errors, touched, "role")
                                )}
                              >
                                <label
                                  htmlFor="role"
                                  className="col-sm-2 control-label"
                                >
                                  บทบาท
                                </label>
                                <div className="col-sm-10">
                                  <Select
                                    showSearch
                                    placeholder="บทบาท"
                                    onChange={this.handleChangeRole}
                                    value={values.role}
                                    defaultValue={values.role}
                                  >
                                    {this.state.roles.map(item => (
                                      <Option
                                        key={item.value}
                                        value={item.value}
                                      >
                                        {item.label}
                                      </Option>
                                    ))}
                                  </Select>
                                  <span className="help-block">
                                    {(errors.role && touched.role) ||
                                      errors.role}
                                  </span>
                                </div>
                              </div>
                              <div className="form-group">
                                <div className="col-md-10 col-md-offset-2">
                                  <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={this.state.submitted}
                                    disabled={isSubmitting || this.state.submitted}
                                  >
                                    บันทึก
                                  </Button>
                                </div>
                              </div>
                            </form>
                          )}
                        </Formik>
                      )}
                    </TabPane>
                    <TabPane tab="การตั้งค่าโปรไฟล์" key="2">
                      <Spin size="large" spinning={this.state.loading} />
                      <Formik
                        initialValues={this.state.profileAttributes}
                        onSubmit={(values, { setSubmitting }) => {
                          this.handleSubmitProfile(values)
                          setSubmitting(false)
                        }}
                        validationSchema={Yup.object().shape({
                          name: Yup.string(),
                          public_email: Yup.string().email(),
                          gravatar_email: Yup.string().email(),
                          gravatar_id: Yup.string(),
                          location: Yup.string(),
                          website: Yup.string().url(),
                          bio: Yup.string(),
                          timezone: Yup.string()
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
                          <form
                            className="form-horizontal"
                            onSubmit={handleSubmit}
                          >
                            <div
                              className={classNames(
                                "form-group",
                                this.hasError(errors, touched, "name")
                              )}
                            >
                              <label
                                htmlFor="name"
                                className="col-sm-2 control-label"
                              >
                                ชื่อ-นามสกุล
                              </label>
                              <div className="col-sm-10">
                                <input
                                  type="text"
                                  className="form-control"
                                  id="name"
                                  placeholder="ชื่อ-นามสกุล"
                                  name="name"
                                  autoComplete="off"
                                  onChange={handleChange}
                                  value={values.name}
                                />
                                <span className="help-block">
                                  {(errors.name && touched.name) || errors.name}
                                </span>
                              </div>
                            </div>
                            <div
                              className={classNames(
                                "form-group",
                                this.hasError(errors, touched, "public_email")
                              )}
                            >
                              <label
                                htmlFor="public_email"
                                className="col-sm-2 control-label"
                              >
                                อีเมล (เปิดเผย)
                              </label>
                              <div className="col-sm-10">
                                <input
                                  type="email"
                                  className="form-control"
                                  id="public_email"
                                  placeholder="อีเมล (เปิดเผย)"
                                  name="public_email"
                                  autoComplete="off"
                                  onChange={handleChange}
                                  value={values.public_email}
                                />
                                <span className="help-block">
                                  {(errors.public_email &&
                                    touched.public_email) ||
                                    errors.public_email}
                                </span>
                              </div>
                            </div>
                            <div
                              className={classNames(
                                "form-group",
                                this.hasError(errors, touched, "website")
                              )}
                            >
                              <label
                                htmlFor="website"
                                className="col-sm-2 control-label"
                              >
                                เว็บไซต์
                              </label>
                              <div className="col-sm-10">
                                <input
                                  type="text"
                                  className="form-control"
                                  id="website"
                                  placeholder="เว็บไซต์"
                                  name="website"
                                  autoComplete="off"
                                  onChange={handleChange}
                                  value={values.website}
                                />
                                <span className="help-block">
                                  {(errors.website && touched.website) ||
                                    errors.website}
                                </span>
                              </div>
                            </div>
                            <div
                              className={classNames(
                                "form-group",
                                this.hasError(errors, touched, "location")
                              )}
                            >
                              <label
                                htmlFor="location"
                                className="col-sm-2 control-label"
                              >
                                สถานที่
                              </label>
                              <div className="col-sm-10">
                                <input
                                  type="text"
                                  className="form-control"
                                  id="location"
                                  placeholder="สถานที่"
                                  name="location"
                                  autoComplete="off"
                                  onChange={handleChange}
                                  value={values.location}
                                />
                                <span className="help-block">
                                  {(errors.location && touched.location) ||
                                    errors.location}
                                </span>
                              </div>
                            </div>
                            <div
                              className={classNames(
                                "form-group",
                                this.hasError(errors, touched, "gravatar_email")
                              )}
                            >
                              <label
                                htmlFor="gravatar_email"
                                className="col-sm-2 control-label"
                              >
                                อีเมล Gravatar
                              </label>
                              <div className="col-sm-10">
                                <input
                                  type="email"
                                  className="form-control"
                                  id="gravatar_email"
                                  placeholder="อีเมล Gravatar"
                                  name="gravatar_email"
                                  autoComplete="off"
                                  onChange={handleChange}
                                  value={values.gravatar_email}
                                />
                                <span className="help-block">
                                  {(errors.gravatar_email &&
                                    touched.gravatar_email) ||
                                    errors.gravatar_email}
                                </span>
                              </div>
                            </div>
                            <div
                              className={classNames(
                                "form-group",
                                this.hasError(errors, touched, "timezone")
                              )}
                            >
                              <label
                                htmlFor="timezone"
                                className="col-sm-2 control-label"
                              >
                                Timezone
                              </label>
                              <div className="col-sm-10">
                                <Select
                                  showSearch
                                  placeholder="timezone"
                                  onChange={this.handleChangeTimezone}
                                  value={values.timezone}
                                  defaultValue={values.timezone}
                                >
                                  {this.state.timezones.map(item => (
                                    <Option key={item.id} value={item.id}>
                                      {item.value}
                                    </Option>
                                  ))}
                                </Select>
                                <span className="help-block">
                                  {(errors.timezone && touched.timezone) ||
                                    errors.timezone}
                                </span>
                              </div>
                            </div>
                            <div
                              className={classNames(
                                "form-group",
                                this.hasError(errors, touched, "bio")
                              )}
                            >
                              <label
                                htmlFor="bio"
                                className="col-sm-2 control-label"
                              >
                                ประวัติ
                              </label>
                              <div className="col-sm-10">
                                <textarea
                                  className="form-control"
                                  id="bio"
                                  placeholder="ประวัติ"
                                  name="bio"
                                  rows="3"
                                  autoComplete="off"
                                  onChange={handleChange}
                                  value={values.bio}
                                />
                                <span className="help-block">
                                  {(errors.bio && touched.bio) || errors.bio}
                                </span>
                              </div>
                            </div>
                            <div className="form-group">
                              <div className="col-md-10 col-md-offset-2">
                                <Button
                                  type="primary"
                                  htmlType="submit"
                                  loading={this.state.submitted}
                                  disabled={isSubmitting || this.state.submitted}
                                >
                                  บันทึก
                                </Button>
                              </div>
                            </div>
                          </form>
                        )}
                      </Formik>
                    </TabPane>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
          <style jsx global>{`
            .loading {
              display: flex;
              justify-content: center;
              align-items: center;
            }
          `}</style>
        </Layout>
      </Aux>
    )
  }
}

export default withRouter(withAuth(UpdateUser))
