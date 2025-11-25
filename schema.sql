-- MySQL dump 10.13  Distrib 8.0.43, for macos15.4 (arm64)
--
-- Host: db-3380.cb0i6wg04k1f.us-east-2.rds.amazonaws.com    Database: project
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `address`
--

DROP TABLE IF EXISTS `address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `line1` varchar(255) DEFAULT NULL,
  `line2` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`address_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allergies`
--

DROP TABLE IF EXISTS `allergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allergies` (
  `allergy_id` int NOT NULL AUTO_INCREMENT,
  `allergen_name` varchar(20) DEFAULT NULL,
  `allergy_description` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`allergy_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appointment`
--

DROP TABLE IF EXISTS `appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment` (
  `appointment_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `doctor_id` int DEFAULT NULL,
  `office_id` int DEFAULT NULL,
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `procedure_code` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`appointment_id`),
  KEY `fk_appointment_patient` (`patient_id`),
  KEY `fk_appointment_doctor` (`doctor_id`),
  KEY `fk_appointment_office` (`office_id`),
  KEY `fk_appointment_procedure` (`procedure_code`),
  KEY `fk_appointment_staff` (`created_by`),
  KEY `appointment_ibfk_4` (`status`),
  CONSTRAINT `fk_appointment_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_appointment_office` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_appointment_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_appointment_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_appointment_status` FOREIGN KEY (`status`) REFERENCES `appointment_statuses` (`code`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER `set_default_appointment_status` BEFORE INSERT ON `appointment` FOR EACH ROW BEGIN
  IF NEW.status IS NULL OR NEW.status = '' THEN
    SET NEW.status = 'scheduled';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER `prevent_doctor_double_booked` BEFORE INSERT ON `appointment` FOR EACH ROW BEGIN
  -- Check if the doctor already has an overlapping appointment
  IF EXISTS (
      SELECT 1
      FROM appointment a
      WHERE a.doctor_id = NEW.doctor_id
        AND a.start_at < NEW.end_at
        AND a.end_at > NEW.start_at
  )
  THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Doctor is already booked for this time slot.';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER `prevent_double_booking` BEFORE INSERT ON `appointment` FOR EACH ROW BEGIN
    -- Check for overlapping appointments for the same patient
    IF EXISTS (
        SELECT 1
        FROM appointment a
        WHERE a.patient_id = NEW.patient_id
          AND a.start_at < NEW.end_at
          AND a.end_at > NEW.start_at
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An overlapping appointment existed!';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER `after_appointment_insert` AFTER INSERT ON `appointment` FOR EACH ROW BEGIN
  DECLARE v_patient_email VARCHAR(255);
  DECLARE v_patient_fname VARCHAR(100);
  DECLARE v_patient_lname VARCHAR(100);
  DECLARE v_doctor_fname VARCHAR(100);
  DECLARE v_doctor_lname VARCHAR(100);
  DECLARE v_patient_name VARCHAR(255);
  DECLARE v_doctor_name VARCHAR(255);
  DECLARE v_appointment_date VARCHAR(100);
  DECLARE v_appointment_time VARCHAR(100);
  
  -- Get patient details
  SELECT 
    p.patient_email, 
    p.patient_fname, 
    p.patient_lname
  INTO 
    v_patient_email, 
    v_patient_fname, 
    v_patient_lname
  FROM patient p
  WHERE p.patient_id = NEW.patient_id;
  
  -- Build patient full name
  SET v_patient_name = CONCAT(v_patient_fname, ' ', v_patient_lname);
  
  -- Get doctor details if assigned
  IF NEW.doctor_id IS NOT NULL THEN
    SELECT 
      d.doc_fname, 
      d.doc_lname
    INTO 
      v_doctor_fname, 
      v_doctor_lname
    FROM doctor d
    WHERE d.doctor_id = NEW.doctor_id;
    
    SET v_doctor_name = CONCAT(v_doctor_fname, ' ', v_doctor_lname);
  ELSE
    SET v_doctor_name = NULL;
  END IF;
  
  -- Format date and time
  SET v_appointment_date = DATE_FORMAT(NEW.start_at, '%W, %M %e, %Y');
  SET v_appointment_time = DATE_FORMAT(NEW.start_at, '%h:%i %p');
  
  -- Insert log entry only if patient has an email
  IF v_patient_email IS NOT NULL AND v_patient_email != '' THEN
    INSERT INTO appointment_email_log (
      appointment_id,
      patient_id,
      patient_email,
      patient_name,
      doctor_name,
      appointment_date,
      appointment_time,
      reason,
      email_sent
    ) VALUES (
      NEW.appointment_id,
      NEW.patient_id,
      v_patient_email,
      v_patient_name,
      v_doctor_name,
      v_appointment_date,
      v_appointment_time,
      NEW.reason,
      FALSE
    );
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER `update_balance` AFTER UPDATE ON `appointment` FOR EACH ROW BEGIN
    -- when appt status marked as completed
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN

        UPDATE patient
        SET balance = IFNULL(balance, 0) + NEW.amount
        WHERE patient_id = NEW.patient_id;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `appointment_email_log`
--

DROP TABLE IF EXISTS `appointment_email_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_email_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int NOT NULL,
  `patient_id` int NOT NULL,
  `patient_email` varchar(255) DEFAULT NULL,
  `patient_name` varchar(255) DEFAULT NULL,
  `doctor_name` varchar(255) DEFAULT NULL,
  `appointment_date` varchar(100) DEFAULT NULL,
  `appointment_time` varchar(100) DEFAULT NULL,
  `reason` text,
  `email_sent` tinyint(1) DEFAULT '0',
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `email_error` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_appointment` (`appointment_id`),
  KEY `idx_email_sent` (`email_sent`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `appointment_email_log_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE CASCADE,
  CONSTRAINT `appointment_email_log_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appointment_statuses`
--

DROP TABLE IF EXISTS `appointment_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_statuses` (
  `code` varchar(255) NOT NULL,
  `display` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `doctor`
--

DROP TABLE IF EXISTS `doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor` (
  `doctor_id` int NOT NULL AUTO_INCREMENT,
  `ssn` char(9) NOT NULL,
  `license_no` varchar(50) NOT NULL,
  `gender` int DEFAULT NULL,
  `doc_fname` varchar(255) NOT NULL,
  `doc_lname` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `availability` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `doc_minit` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`doctor_id`),
  UNIQUE KEY `ssn` (`ssn`),
  KEY `doctor_staff` (`created_by`),
  CONSTRAINT `doctor_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `doctor_office`
--

DROP TABLE IF EXISTS `doctor_office`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_office` (
  `id` int NOT NULL AUTO_INCREMENT,
  `doctor_id` int DEFAULT NULL,
  `office_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `provider_id` (`doctor_id`),
  KEY `location_id` (`office_id`),
  KEY `doc_office_staff` (`created_by`),
  CONSTRAINT `doc_office_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `doctor_office_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `doctor_office_ibfk_2` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `emergency_contact`
--

DROP TABLE IF EXISTS `emergency_contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emergency_contact` (
  `patient_id` int DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `relationship` varchar(255) DEFAULT NULL,
  `econtact_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`econtact_id`),
  KEY `econtact_patient` (`patient_id`),
  CONSTRAINT `econtact_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insurance`
--

DROP TABLE IF EXISTS `insurance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance` (
  `patient_id` int DEFAULT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `policy_no` varchar(255) DEFAULT NULL,
  `group_no` varchar(255) DEFAULT NULL,
  `plan_name` varchar(255) DEFAULT NULL,
  `effective_start` date DEFAULT NULL,
  `effective_end` date DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `insurance_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`insurance_id`),
  KEY `created_by` (`created_by`),
  KEY `insurance_patient` (`patient_id`),
  CONSTRAINT `insurance_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `login`
--

DROP TABLE IF EXISTS `login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login` (
  `user_id` bigint unsigned NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('PATIENT','DOCTOR','STAFF') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role`,`user_id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lookup_gender`
--

DROP TABLE IF EXISTS `lookup_gender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_gender` (
  `gender_id` int NOT NULL AUTO_INCREMENT,
  `gender_label` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`gender_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lookup_procedures`
--

DROP TABLE IF EXISTS `lookup_procedures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_procedures` (
  `procedure_id` int NOT NULL AUTO_INCREMENT,
  `procedure_label` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`procedure_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lookup_race`
--

DROP TABLE IF EXISTS `lookup_race`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_race` (
  `race_id` int NOT NULL AUTO_INCREMENT,
  `race_label` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`race_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lookup_relationship`
--

DROP TABLE IF EXISTS `lookup_relationship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_relationship` (
  `relationship_id` int NOT NULL AUTO_INCREMENT,
  `relationship_label` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`relationship_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lookup_role`
--

DROP TABLE IF EXISTS `lookup_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_role` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_label` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lookup_status`
--

DROP TABLE IF EXISTS `lookup_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_status` (
  `status_id` int NOT NULL AUTO_INCREMENT,
  `status_label` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_history`
--

DROP TABLE IF EXISTS `medical_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `condition_name` varchar(255) DEFAULT NULL,
  `description` text,
  `diagnosis_date` date DEFAULT NULL,
  `resolved_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `allergies` text,
  `medication` text,
  PRIMARY KEY (`history_id`),
  KEY `history_patient` (`patient_id`),
  KEY `history_staff` (`created_by`),
  CONSTRAINT `history_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `history_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medication`
--

DROP TABLE IF EXISTS `medication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medication` (
  `medication_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `rxnorm_code` varchar(50) DEFAULT NULL,
  `description` text,
  `patient_id` int DEFAULT NULL,
  PRIMARY KEY (`medication_id`),
  KEY `med_patient` (`patient_id`),
  CONSTRAINT `med_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `office`
--

DROP TABLE IF EXISTS `office`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `office` (
  `office_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `address_id` int DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`office_id`),
  KEY `created_by` (`created_by`),
  KEY `office_address` (`address_id`),
  CONSTRAINT `office_address` FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient` (
  `patient_id` int NOT NULL AUTO_INCREMENT,
  `patient_fname` varchar(255) DEFAULT NULL,
  `patient_lname` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` int DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address_id` int DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `med_id` int DEFAULT NULL,
  `patient_minit` varchar(1) DEFAULT NULL,
  `patient_email` varchar(254) DEFAULT NULL,
  `prim_doctor` int DEFAULT NULL,
  PRIMARY KEY (`patient_id`),
  KEY `address_id` (`address_id`),
  KEY `created_by` (`created_by`),
  KEY `patient_pdoctor` (`prim_doctor`),
  KEY `patient_gender` (`gender`),
  KEY `patient_medication` (`med_id`),
  CONSTRAINT `patient_gender` FOREIGN KEY (`gender`) REFERENCES `lookup_gender` (`gender_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`),
  CONSTRAINT `patient_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`),
  CONSTRAINT `patient_medication` FOREIGN KEY (`med_id`) REFERENCES `medication` (`medication_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `patient_pdoctor` FOREIGN KEY (`prim_doctor`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `patient_chk_1` CHECK ((`patient_email` like _utf8mb4'%_@__%.__%'))
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER `log_patient_updates` AFTER UPDATE ON `patient` FOR EACH ROW BEGIN
    -- patient_fname changed
    IF OLD.patient_fname <> NEW.patient_fname THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'patient_fname', NEW.patient_fname);
    END IF;

    -- patient_lname changed
    IF OLD.patient_lname <> NEW.patient_lname THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'patient_lname', NEW.patient_lname);
    END IF;

    -- patient_minit changed
    IF OLD.patient_minit <> NEW.patient_minit THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'patient_minit', NEW.patient_minit);
    END IF;

    -- dob changed
    IF OLD.dob <> NEW.dob THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'dob', NEW.dob);
    END IF;

    -- gender changed
    IF OLD.gender <> NEW.gender THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'gender', NEW.gender);
    END IF;

    -- phone changed
    IF OLD.phone <> NEW.phone THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'phone', NEW.phone);
    END IF;

    -- address_id changed
    IF OLD.address_id <> NEW.address_id THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'address_id', NEW.address_id);
    END IF;

    -- balance changed
    IF OLD.balance <> NEW.balance THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'balance', NEW.balance);
    END IF;

    -- patient_email changed
    IF OLD.patient_email <> NEW.patient_email THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'patient_email', NEW.patient_email);
    END IF;

    -- prim_doctor changed
    IF OLD.prim_doctor <> NEW.prim_doctor THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'prim_doctor', NEW.prim_doctor);
    END IF;

    -- med_id changed
    IF OLD.med_id <> NEW.med_id THEN
        INSERT INTO patient_update_log (patient_id, column_name, new_value)
        VALUES (OLD.patient_id, 'med_id', NEW.med_id);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `patient_allergy`
--

DROP TABLE IF EXISTS `patient_allergy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_allergy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pat_id` int DEFAULT NULL,
  `alrgy_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pat_id` (`pat_id`),
  KEY `alrgy_id` (`alrgy_id`),
  CONSTRAINT `patient_allergy_ibfk_1` FOREIGN KEY (`pat_id`) REFERENCES `patient` (`patient_id`),
  CONSTRAINT `patient_allergy_ibfk_2` FOREIGN KEY (`alrgy_id`) REFERENCES `allergies` (`allergy_id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient_medication`
--

DROP TABLE IF EXISTS `patient_medication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_medication` (
  `patient_id` int NOT NULL,
  `med_id` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `dosage` varchar(50) DEFAULT NULL,
  `prescribed_by` int DEFAULT NULL,
  PRIMARY KEY (`patient_id`,`med_id`),
  KEY `patient_medication_ibfk_2` (`med_id`),
  KEY `patient_medication_ibfk_3` (`prescribed_by`),
  CONSTRAINT `patient_medication_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `patient_medication_ibfk_2` FOREIGN KEY (`med_id`) REFERENCES `medication` (`medication_id`) ON DELETE RESTRICT,
  CONSTRAINT `patient_medication_ibfk_3` FOREIGN KEY (`prescribed_by`) REFERENCES `doctor` (`doctor_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient_update_log`
--

DROP TABLE IF EXISTS `patient_update_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_update_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `column_name` varchar(255) NOT NULL,
  `new_value` text,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_patient_update_log` (`patient_id`),
  CONSTRAINT `fk_patient_update_log` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `procedures`
--

DROP TABLE IF EXISTS `procedures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procedures` (
  `code` varchar(255) NOT NULL,
  `display` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `referral`
--

DROP TABLE IF EXISTS `referral`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referral` (
  `Ref_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `to_provider_id` int DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`Ref_id`),
  KEY `patient_id` (`patient_id`),
  KEY `to_provider_id` (`to_provider_id`),
  KEY `referral_created_by` (`created_by`),
  CONSTRAINT `referral_created_by` FOREIGN KEY (`created_by`) REFERENCES `doctor` (`doctor_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `referral_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`),
  CONSTRAINT `referral_ibfk_3` FOREIGN KEY (`to_provider_id`) REFERENCES `doctor` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `staff_id` int NOT NULL AUTO_INCREMENT,
  `staff_first_name` varchar(50) DEFAULT NULL,
  `staff_last_name` varchar(50) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(12) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ssn` char(9) DEFAULT NULL,
  `office_id` int DEFAULT NULL,
  `staff_minit` char(1) DEFAULT NULL,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `ssn` (`ssn`),
  KEY `role` (`role`),
  KEY `fk_staff_office` (`office_id`),
  CONSTRAINT `fk_staff_office` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'project'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;
/*!50106 DROP EVENT IF EXISTS `mark_no_shows_daily` */;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = utf8mb4 */ ;;
/*!50003 SET character_set_results = utf8mb4 */ ;;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'UTC' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`admin`@`%`*/ /*!50106 EVENT `mark_no_shows_daily` ON SCHEDULE EVERY 1 DAY STARTS '2025-10-29 00:05:00' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE appointment
  SET status = 'no-show'
  WHERE appointment_time < NOW()
    AND status NOT IN ('canceled', 'completed', 'no-show', 'checked_in') */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

--
-- Dumping routines for database 'project'
--
/*!50003 DROP PROCEDURE IF EXISTS `add_doctor_by_staff` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`admin`@`%` PROCEDURE `add_doctor_by_staff`(
    IN  p_staff_id      INT,
    IN  p_ssn           VARCHAR(20),
    IN  p_licence_no    VARCHAR(50),
    IN  p_gender        VARCHAR(10),
    IN  p_doc_fname     VARCHAR(100),
    IN  p_doc_minit     CHAR(1),
    IN  p_doc_lname     VARCHAR(100),
    IN  p_phone         VARCHAR(20),
    IN  p_email         VARCHAR(255),
    IN  p_availability  VARCHAR(100),
    OUT p_doctor_id     INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    IF EXISTS (SELECT 1 FROM doctors WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Doctor email already exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM doctors WHERE licence_no = p_licence_no) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Doctor licence number already exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM doctors WHERE ssn = p_ssn) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Doctor SSN already exists';
    END IF;
    
    INSERT INTO doctors
        (ssn, licence_no, gender, doc_fname, doc_minit, doc_lname, 
         phone, email, availability, created_by, created_at)
    VALUES
        (p_ssn, p_licence_no, p_gender, p_doc_fname, p_doc_minit, p_doc_lname, 
         p_phone, p_email, p_availability, p_staff_id, NOW());
    
    SET p_doctor_id = LAST_INSERT_ID();
    
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 18:07:12
