package ca.kailo.berkeley

import lombok.extern.slf4j.Slf4j
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@Slf4j
@SpringBootApplication
class Application {

}

fun main(args: Array<String>) {
    SpringApplication.run(Application::class.java, *args)
}